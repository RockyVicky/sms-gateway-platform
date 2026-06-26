import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { DevicesService } from '../devices/devices.service';
import { DevicesGateway } from '../devices/devices.gateway';
import { SmsRegistry } from '../devices/sms.registry';
import { Logger } from '@nestjs/common';

@Processor('sms-delivery')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly devicesService: DevicesService,
    private readonly devicesGateway: DevicesGateway,
    private readonly smsRegistry: SmsRegistry,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { messageId } = job.data;
    this.logger.log(
      `Processing SMS delivery job: ${job.id} for message ID: ${messageId}`,
    );

    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      this.logger.warn(`Message ${messageId} not found in database. Skipping.`);
      return;
    }

    // Update message status to processing
    message.status = 'processing';
    message.attempts = job.attemptsMade + 1;
    await message.save();

    let targetDevice = null;
    if (message.deviceId) {
      targetDevice = await this.devicesService.findDeviceById(message.deviceId);
    } else {
      targetDevice = await this.devicesService.findOnlineDevice();
    }

    if (!targetDevice || targetDevice.status !== 'online') {
      message.status = 'failed';
      message.errorMessage = 'No online Android gateway devices available';
      await message.save();
      throw new Error(
        'No online Android gateway devices available to process this message',
      );
    }

    // Save target device ID back in case of auto-routing
    message.deviceId = targetDevice.deviceId;
    await message.save();

    // Create a deferred promise and await the device's WebSocket status callback
    const resultPromise = new Promise<boolean>((resolve, reject) => {
      this.smsRegistry.register(messageId, resolve, reject, 60000); // 60s timeout
    });

    // Dispatch message over WebSockets
    const dispatched = this.devicesGateway.sendSmsToDevice(
      targetDevice.deviceId,
      {
        messageId: message._id.toString(),
        recipient: message.recipient,
        content: message.content,
      },
    );

    if (!dispatched) {
      this.smsRegistry.clear(messageId);
      throw new Error(
        `Failed to dispatch message ID ${messageId} over WebSockets`,
      );
    }

    // Await either device status report or timeout
    try {
      await resultPromise;
      this.logger.log(
        `SMS delivery job ${job.id} succeeded for message ID ${messageId}`,
      );
    } catch (err) {
      this.logger.error(
        `SMS delivery job ${job.id} failed for message ID ${messageId}. Error: ${err.message}`,
      );
      throw err; // Throws to trigger BullMQ retry
    }
  }
}

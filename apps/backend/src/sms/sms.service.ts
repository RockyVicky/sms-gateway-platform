import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendBulkSmsDto } from './dto/send-bulk-sms.dto';
import { DevicesService } from '../devices/devices.service';
import { isValidPhoneNumber } from '@sms-gateway/utils';

@Injectable()
export class SmsService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectQueue('sms-delivery') private readonly smsQueue: Queue,
    private readonly devicesService: DevicesService,
  ) {}

  // Send single SMS (Push to queue)
  async sendSms(userId: string, dto: SendSmsDto): Promise<Message> {
    const { recipient, content, deviceId } = dto;

    // Validate phone number format
    if (!isValidPhoneNumber(recipient)) {
      throw new BadRequestException(
        'Recipient phone number must be in E.164 format (e.g. +919876543210)',
      );
    }

    if (deviceId) {
      const targetDevice = await this.devicesService.findDeviceById(deviceId);
      if (!targetDevice) {
        throw new NotFoundException(`Device ${deviceId} not found`);
      }
    }

    // Save message to MongoDB
    const newMessage = new this.messageModel({
      userId,
      deviceId: deviceId || null,
      recipient,
      content,
      status: 'queued',
    });

    const savedMessage = await newMessage.save();

    // Push job to BullMQ queue
    await this.smsQueue.add(
      'send-sms',
      { messageId: savedMessage._id.toString() },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 30000, // 30 seconds delay
        },
        jobId: savedMessage._id.toString(),
        removeOnComplete: true,
        removeOnFail: false, // Keep failures for diagnostics
      },
    );

    return savedMessage.toJSON();
  }

  // Send bulk SMS (Push multiple jobs to queue)
  async sendBulkSms(
    userId: string,
    dto: SendBulkSmsDto,
  ): Promise<{ success: boolean; enqueuedCount: number; errors: string[] }> {
    const { recipients, content, deviceId } = dto;
    const errors: string[] = [];
    let enqueuedCount = 0;

    if (deviceId) {
      const targetDevice = await this.devicesService.findDeviceById(deviceId);
      if (!targetDevice) {
        throw new NotFoundException(`Device ${deviceId} not found`);
      }
    }

    for (const recipient of recipients) {
      if (!isValidPhoneNumber(recipient)) {
        errors.push(
          `Recipient ${recipient} is not in E.164 format (e.g. +919876543210)`,
        );
        continue;
      }

      try {
        const newMessage = new this.messageModel({
          userId,
          deviceId: deviceId || null,
          recipient,
          content,
          status: 'queued',
        });

        const savedMessage = await newMessage.save();

        // Push job to BullMQ queue
        await this.smsQueue.add(
          'send-sms',
          { messageId: savedMessage._id.toString() },
          {
            attempts: 3,
            backoff: {
              type: 'fixed',
              delay: 30000,
            },
            jobId: savedMessage._id.toString(),
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        enqueuedCount++;
      } catch (err: any) {
        errors.push(`Failed to queue message for ${recipient}: ${err.message}`);
      }
    }

    return {
      success: enqueuedCount > 0,
      enqueuedCount,
      errors,
    };
  }

  // List message logs for a user
  async getMessageHistory(userId: string): Promise<Message[]> {
    const messages = await this.messageModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return messages.map((m) => m.toJSON() as unknown as Message);
  }
}

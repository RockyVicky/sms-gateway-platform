import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { Message, MessageDocument } from '../sms/schemas/message.schema';
import { SmsRegistry } from './sms.registry';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
@Injectable()
export class DevicesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DevicesGateway.name);
  private activeSockets = new Map<string, Socket>();

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly smsRegistry: SmsRegistry,
  ) {}

  async handleConnection(client: Socket) {
    const deviceId =
      client.handshake.auth?.deviceId || client.handshake.query?.deviceId;

    if (!deviceId || typeof deviceId !== 'string') {
      this.logger.warn(
        `Connection rejected: missing deviceId. Socket: ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    const device = await this.deviceModel.findOne({ deviceId }).exec();
    if (!device) {
      this.logger.warn(
        `Connection rejected: device ${deviceId} is not registered. Socket: ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    // Update status to online
    device.status = 'online';
    device.socketId = client.id;
    device.lastSeenAt = new Date();
    await device.save();

    this.activeSockets.set(deviceId, client);
    this.logger.log(
      `Device connected: ${device.name} (${deviceId}). Socket: ${client.id}`,
    );
  }

  async handleDisconnect(client: Socket) {
    const device = await this.deviceModel
      .findOne({ socketId: client.id })
      .exec();
    if (device) {
      device.status = 'offline';
      device.socketId = null;
      device.lastSeenAt = new Date();
      await device.save();

      this.activeSockets.delete(device.deviceId);
      this.logger.log(
        `Device disconnected: ${device.name} (${device.deviceId}). Socket: ${client.id}`,
      );
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battery: number; signal: number },
  ) {
    const device = await this.deviceModel
      .findOne({ socketId: client.id })
      .exec();
    if (device) {
      device.battery = data.battery ?? device.battery;
      device.signal = data.signal ?? device.signal;
      device.lastSeenAt = new Date();
      await device.save();
      this.logger.debug(
        `Heartbeat received from ${device.name}: Battery: ${data.battery}%, Signal: ${data.signal}`,
      );
    }
  }

  sendSmsToDevice(
    deviceId: string,
    payload: { messageId: string; recipient: string; content: string },
  ): boolean {
    const socket = this.activeSockets.get(deviceId);
    if (!socket) {
      return false;
    }
    socket.emit('sms:send', payload);
    return true;
  }

  @SubscribeMessage('sms:status')
  async handleSmsStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: string; status: 'sent' | 'failed'; error?: string },
  ) {
    const device = await this.deviceModel
      .findOne({ socketId: client.id })
      .exec();
    if (!device) {
      this.logger.warn(
        `sms:status received from unrecognized socket: ${client.id}`,
      );
      return;
    }

    const message = await this.messageModel.findById(data.messageId).exec();
    if (!message) {
      this.logger.warn(
        `sms:status received for non-existent message: ${data.messageId}`,
      );
      return;
    }

    // Update message status
    message.status = data.status;
    message.errorMessage = data.error || null;
    if (data.status === 'sent') {
      message.sentAt = new Date();
      await message.save();
      this.smsRegistry.resolve(data.messageId);
    } else {
      await message.save();
      this.smsRegistry.reject(
        data.messageId,
        data.error || 'Device failed to dispatch SMS',
      );
    }

    this.logger.log(
      `SMS ${data.messageId} status updated to ${data.status} by device ${device.name}`,
    );
  }
}

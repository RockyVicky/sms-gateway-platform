import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { DeviceStatus } from '@sms-gateway/types';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  provider: string;

  @Prop({
    type: String,
    enum: ['online', 'offline', 'paused'],
    default: 'offline',
  })
  status: DeviceStatus;

  @Prop({ type: Number, default: 100 })
  battery: number;

  @Prop({ type: Number, default: 4 })
  signal: number;

  @Prop({ type: String, default: null })
  socketId: string | null;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ type: Date, default: Date.now })
  lastSeenAt: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

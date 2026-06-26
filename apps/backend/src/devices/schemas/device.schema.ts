import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { DeviceStatus } from '@sms-gateway/types';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
  // unique: true automatically registers a unique index for fast O(1) device ID lookups
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  // index: true is added because phoneNumber is queried frequently during registration verification and client listings
  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: true })
  provider: string;

  // index: true is added because we query by status (e.g. finding 'online' devices) to dispatch SMS routing requests
  @Prop({
    type: String,
    enum: ['online', 'offline', 'paused'],
    default: 'offline',
    index: true,
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

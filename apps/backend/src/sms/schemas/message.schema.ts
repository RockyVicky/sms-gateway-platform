import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { MessageStatus } from '@sms-gateway/types';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: String, default: null })
  deviceId: string | null;

  @Prop({ required: true })
  recipient: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    enum: ['pending', 'queued', 'processing', 'sent', 'delivered', 'failed'],
    default: 'pending',
  })
  status: MessageStatus;

  @Prop({ type: String, default: null })
  errorMessage: string | null;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  @Prop({ type: Number, default: 3 })
  maxAttempts: number;

  @Prop({ type: Date, default: null })
  sentAt: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

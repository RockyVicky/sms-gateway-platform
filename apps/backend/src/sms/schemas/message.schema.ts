import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { MessageStatus } from '@sms-gateway/types';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  // index: true is added because we query messages by deviceId to show device history logs in the dashboard
  @Prop({ type: String, default: null, index: true })
  deviceId: string | null;

  // index: true is added because recipient searches (such as checking dispatch status of a specific user) occur frequently
  @Prop({ required: true, index: true })
  recipient: string;

  @Prop({ required: true })
  content: string;

  // index: true is added because message queues and stats dashboards query by status (e.g. tracking failure rates)
  @Prop({
    type: String,
    enum: ['pending', 'queued', 'processing', 'sent', 'delivered', 'failed'],
    default: 'pending',
    index: true,
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

// Index createdAt (descending) to optimize dashboard historical queries and log pagination orders
MessageSchema.index({ createdAt: -1 });

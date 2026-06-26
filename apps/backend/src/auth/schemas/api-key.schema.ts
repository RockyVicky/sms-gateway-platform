import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { ApiKeyStatus } from '@sms-gateway/types';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  keyPrefix: string; // e.g. "sg_live_" + first 4 chars

  @Prop({ required: true, unique: true })
  keyHash: string; // SHA-256 hash

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: String, enum: ['active', 'revoked'], default: 'active' })
  status: ApiKeyStatus;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

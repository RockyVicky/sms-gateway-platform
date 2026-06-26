import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpRequestDocument = OtpRequest & Document;

@Schema({ timestamps: true })
export class OtpRequest {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  @Prop({ type: Boolean, default: false })
  verified: boolean;
}

export const OtpRequestSchema = SchemaFactory.createForClass(OtpRequest);

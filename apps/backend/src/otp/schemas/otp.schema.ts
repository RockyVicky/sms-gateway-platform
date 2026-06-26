import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpRequestDocument = OtpRequest & Document;

@Schema({ timestamps: true })
export class OtpRequest {
  // index: true is added because phone is used to lookup the latest active verification request during OTP submissions
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  otpHash: string;

  // index: true is added to speed up queries verifying if the OTP request is expired (expiresAt > Date.now())
  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  @Prop({ type: Boolean, default: false })
  verified: boolean;
}

export const OtpRequestSchema = SchemaFactory.createForClass(OtpRequest);

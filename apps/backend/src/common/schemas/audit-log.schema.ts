import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  userId: string | null;

  @Prop({ required: true })
  action: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  details: any;

  @Prop({ required: false, default: null })
  ipAddress: string | null;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SmsProcessor } from './sms.processor';
import { Message, MessageSchema } from './schemas/message.schema';
import { DevicesModule } from '../devices/devices.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    BullModule.registerQueue({
      name: 'sms-delivery',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds initial delay before retry
        },
        removeOnComplete: true, // Clean up successful jobs to save Redis memory
        removeOnFail: false, // Retain failed jobs in the failed queue state (acting as a Redis DLQ)
      },
    }),
    DevicesModule,
    AuthModule,
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsProcessor],
  exports: [SmsService, SmsProcessor],
})
export class SmsModule {}

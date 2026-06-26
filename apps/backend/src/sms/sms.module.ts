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
    BullModule.registerQueue({ name: 'sms-delivery' }),
    DevicesModule,
    AuthModule,
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsProcessor],
  exports: [SmsService, SmsProcessor],
})
export class SmsModule {}

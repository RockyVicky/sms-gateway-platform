import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DevicesGateway } from './devices.gateway';
import { SmsRegistry } from './sms.registry';
import { Device, DeviceSchema } from './schemas/device.schema';
import { Message, MessageSchema } from '../sms/schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesGateway, SmsRegistry],
  exports: [DevicesService, DevicesGateway, SmsRegistry],
})
export class DevicesModule {}

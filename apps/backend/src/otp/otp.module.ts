import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { OtpRequest, OtpRequestSchema } from './schemas/otp.schema';
import { SmsModule } from '../sms/sms.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OtpRequest.name, schema: OtpRequestSchema },
    ]),
    SmsModule,
    AuthModule,
  ],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}

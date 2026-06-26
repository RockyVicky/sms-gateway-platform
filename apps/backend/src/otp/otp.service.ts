import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OtpRequest, OtpRequestDocument } from './schemas/otp.schema';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SmsService } from '../sms/sms.service';
import { sha256 } from '@sms-gateway/utils';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(OtpRequest.name)
    private readonly otpModel: Model<OtpRequestDocument>,
    private readonly smsService: SmsService,
  ) {}

  // Generate and send 6-digit OTP
  async sendOtp(userId: string, dto: SendOtpDto): Promise<any> {
    const { phone } = dto;

    // Generate 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = sha256(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate existing active OTPs for this phone
    await this.otpModel
      .updateMany(
        { phone, verified: false },
        { $set: { expiresAt: new Date(0) } },
      )
      .exec();

    // Save OtpRequest to DB
    const newOtp = new this.otpModel({
      phone,
      otpHash,
      expiresAt,
    });
    await newOtp.save();

    // Trigger SMS sending queue job
    await this.smsService.sendSms(userId, {
      recipient: phone,
      content: `Your OTP code is ${rawOtp}. Valid for 5 minutes.`,
    });

    return {
      success: true,
      message: 'OTP generated and dispatched successfully',
    };
  }

  // Verify OTP input code
  async verifyOtp(dto: VerifyOtpDto): Promise<any> {
    const { phone, otp } = dto;
    const inputHash = sha256(otp);

    // Find the latest active OTP request
    const otpRequest = await this.otpModel
      .findOne({ phone, verified: false })
      .sort({ createdAt: -1 })
      .exec();

    if (!otpRequest) {
      throw new BadRequestException(
        'No active OTP request found for this phone number',
      );
    }

    // Check expiry
    if (new Date() > otpRequest.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    // Check retry attempt limits (Max 3 attempts)
    if (otpRequest.attempts >= 3) {
      throw new BadRequestException(
        'Too many verification attempts. Please request a new OTP.',
      );
    }

    // Match code hash
    if (otpRequest.otpHash !== inputHash) {
      otpRequest.attempts += 1;
      await otpRequest.save();
      throw new BadRequestException(
        `Invalid OTP code. Attempts remaining: ${3 - otpRequest.attempts}`,
      );
    }

    // Verify successfully
    otpRequest.verified = true;
    await otpRequest.save();

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }
}

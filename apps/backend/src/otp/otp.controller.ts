import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UnifiedAuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PhoneThrottlerGuard } from './guards/phone-throttler.guard';

@ApiTags('OTP Delivery & Verification')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(UnifiedAuthGuard, PhoneThrottlerGuard)
  @Throttle({ otp: { limit: 3, ttl: 300000 } })
  @ApiBearerAuth('bearer-token')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Generate, hash, and dispatch a 6-digit verification OTP via SMS',
    description:
      'Generates a secure random 6-digit OTP, saves the hash to the database, and schedules an SMS dispatch. Limits to 3 attempts per phone number per 5 minutes.',
  })
  @ApiResponse({
    status: 201,
    description: 'OTP generated and enqueued for SMS dispatch',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized request' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded for this phone number',
  })
  async send(@CurrentUser() user: any, @Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(user.id, dto);
  }

  @Post('verify')
  @UseGuards(UnifiedAuthGuard, PhoneThrottlerGuard)
  @Throttle({ otp: { limit: 5, ttl: 60000 } }) // Allow up to 5 validation queries per minute
  @ApiBearerAuth('bearer-token')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Verify an SMS OTP verification code',
    description:
      'Compares the incoming raw OTP against the SHA-256 hash in the database, validating expiration and retry limits.',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or rate-limited OTP',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized request' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded for verification attempts',
  })
  async verify(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }
}

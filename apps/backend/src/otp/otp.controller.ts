import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UnifiedAuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(UnifiedAuthGuard)
  async send(@CurrentUser() user: any, @Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(user.id, dto);
  }

  @Post('verify')
  @UseGuards(UnifiedAuthGuard)
  async verify(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }
}

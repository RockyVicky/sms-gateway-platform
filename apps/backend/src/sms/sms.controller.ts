import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendBulkSmsDto } from './dto/send-bulk-sms.dto';
import { UnifiedAuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @UseGuards(UnifiedAuthGuard)
  async send(@CurrentUser() user: any, @Body() dto: SendSmsDto) {
    return this.smsService.sendSms(user.id, dto);
  }

  @Post('send-bulk')
  @UseGuards(UnifiedAuthGuard)
  async sendBulk(@CurrentUser() user: any, @Body() dto: SendBulkSmsDto) {
    return this.smsService.sendBulkSms(user.id, dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@CurrentUser() user: any) {
    return this.smsService.getMessageHistory(user.id);
  }
}

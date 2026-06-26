import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendBulkSmsDto } from './dto/send-bulk-sms.dto';
import { UnifiedAuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('SMS Dispatch Engine')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @UseGuards(UnifiedAuthGuard)
  @Throttle({ sms: { limit: 5, ttl: 10000 } })
  @ApiBearerAuth('bearer-token')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Enqueue a single transactional SMS for delivery',
    description:
      'Enqueues an outbound SMS job. Authorizes via JWT bearer token or client API Key (passed in x-api-key header). Limits to 5 submissions per 10 seconds per IP.',
  })
  @ApiResponse({ status: 201, description: 'SMS enqueued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized client request' })
  @ApiResponse({
    status: 400,
    description: 'Device offline or schema validation error',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async send(@CurrentUser() user: any, @Body() dto: SendSmsDto) {
    return this.smsService.sendSms(user.id, dto);
  }

  @Post('send-bulk')
  @UseGuards(UnifiedAuthGuard)
  @Throttle({ sms: { limit: 5, ttl: 10000 } })
  @ApiBearerAuth('bearer-token')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Enqueue a batch of transactional SMS messages',
    description:
      'Enqueues multiple outbound SMS jobs in a single batch. Authorizes via JWT bearer token or client API Key. Limits to 5 submissions per 10 seconds per IP.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk SMS batch enqueued successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized client request' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendBulk(@CurrentUser() user: any, @Body() dto: SendBulkSmsDto) {
    return this.smsService.sendBulkSms(user.id, dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @ApiOperation({
    summary: 'Retrieve user message history logs',
    description:
      'Returns historical dispatch records and statuses associated with the authenticated account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message logs retrieved successfully',
  })
  async getHistory(@CurrentUser() user: any) {
    return this.smsService.getMessageHistory(user.id);
  }
}

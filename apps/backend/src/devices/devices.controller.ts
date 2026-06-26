import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Devices Gateway Management')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register or update physical SMS gateway device node',
  })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'Payload validation or database error',
  })
  async register(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @ApiOperation({
    summary:
      'List all registered device gateway nodes with signal/battery telemetry',
  })
  @ApiResponse({
    status: 200,
    description: 'Device registries retrieved successfully',
  })
  async list() {
    return this.devicesService.findAllDevices();
  }
}

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list() {
    return this.devicesService.findAllDevices();
  }
}

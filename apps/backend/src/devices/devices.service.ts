import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  // Register or update device metadata
  async registerDevice(dto: RegisterDeviceDto): Promise<Device> {
    const { deviceId, name, phoneNumber, provider, publicKey } = dto;

    const device = await this.deviceModel
      .findOneAndUpdate(
        { deviceId },
        {
          name,
          phoneNumber,
          provider,
          publicKey,
          lastSeenAt: new Date(),
        },
        { new: true, upsert: true }, // Create if doesn't exist
      )
      .exec();

    return device.toJSON();
  }

  // Get all registered devices
  async findAllDevices(): Promise<Device[]> {
    const devices = await this.deviceModel.find().exec();
    return devices.map((d) => d.toJSON() as unknown as Device);
  }

  // Find a registered online device (e.g. for auto-routing)
  async findOnlineDevice(): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ status: 'online' }).exec();
  }

  // Find device by UUID
  async findDeviceById(deviceId: string): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ deviceId }).exec();
  }
}

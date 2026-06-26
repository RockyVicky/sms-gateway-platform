import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { SmsService } from './sms.service';
import { Message } from './schemas/message.schema';
import { DevicesService } from '../devices/devices.service';

describe('SmsService', () => {
  let service: SmsService;
  let mockQueue: any;
  let mockDevicesService: any;

  const mockMessage = {
    _id: 'msg_123',
    userId: 'user_1',
    deviceId: 'device_1',
    recipient: '+916382289712',
    content: 'Test content',
    status: 'queued',
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    toJSON: jest.fn().mockReturnValue({
      _id: 'msg_123',
      userId: 'user_1',
      deviceId: 'device_1',
      recipient: '+916382289712',
      content: 'Test content',
      status: 'queued',
    }),
  };

  const mockMessageModel = jest.fn().mockImplementation((dto) => {
    return {
      ...mockMessage,
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'msg_123',
        ...dto,
        toJSON: () => ({ _id: 'msg_123', ...dto }),
      }),
    };
  });

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_123' }),
    };

    mockDevicesService = {
      findDeviceById: jest.fn().mockResolvedValue({ deviceId: 'device_1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: getQueueToken('sms-delivery'),
          useValue: mockQueue,
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendSms', () => {
    it('should queue a single valid SMS successfully', async () => {
      const result = await service.sendSms('user_1', {
        recipient: '+916382289712',
        content: 'Test message',
        deviceId: 'device_1',
      });

      expect(result).toBeDefined();
      expect(result.recipient).toBe('+916382289712');
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deviceId is specified but not found', async () => {
      mockDevicesService.findDeviceById.mockResolvedValueOnce(null);

      await expect(
        service.sendSms('user_1', {
          recipient: '+916382289712',
          content: 'Test message',
          deviceId: 'invalid_device',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendBulkSms', () => {
    it('should queue multiple valid SMS successfully', async () => {
      const result = await service.sendBulkSms('user_1', {
        recipients: ['+916382289712', '+919876543210'],
        content: 'Bulk broadcast',
        deviceId: 'device_1',
      });

      expect(result.success).toBe(true);
      expect(result.enqueuedCount).toBe(2);
      expect(result.errors.length).toBe(0);
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should handle formatting errors gracefully and skip invalid recipients', async () => {
      const result = await service.sendBulkSms('user_1', {
        recipients: ['+916382289712', 'invalid_number'],
        content: 'Bulk broadcast',
        deviceId: 'device_1',
      });

      expect(result.success).toBe(true);
      expect(result.enqueuedCount).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('is not in E.164 format');
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });
  });
});

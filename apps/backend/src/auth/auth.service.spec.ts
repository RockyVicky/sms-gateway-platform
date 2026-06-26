import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { ApiKey } from './schemas/api-key.schema';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    _id: 'user_id',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: 'user',
    refreshTokens: [],
    save: jest.fn().mockResolvedValue({
      _id: 'user_id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    }),
  };

  const mockUserModel = jest.fn().mockImplementation(() => mockUser);
  (mockUserModel as any).findOne = jest.fn();
  (mockUserModel as any).findById = jest.fn();
  (mockUserModel as any).findByIdAndUpdate = jest.fn();

  const mockApiKey = {
    name: 'Test Key',
    keyPrefix: 'sg_live_1234',
    keyHash: 'hash',
    userId: 'user_id',
    status: 'active',
    save: jest.fn().mockResolvedValue({
      name: 'Test Key',
      keyPrefix: 'sg_live_1234',
      keyHash: 'hash',
      userId: 'user_id',
      status: 'active',
    }),
  };

  const mockApiKeyModel = jest.fn().mockImplementation(() => mockApiKey);
  (mockApiKeyModel as any).find = jest.fn();
  (mockApiKeyModel as any).findOne = jest.fn();
  (mockApiKeyModel as any).updateOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(ApiKey.name),
          useValue: mockApiKeyModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked_token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mocked_secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

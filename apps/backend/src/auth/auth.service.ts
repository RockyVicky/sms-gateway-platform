import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateRandomString, sha256 } from '@sms-gateway/utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Register a new user
  async register(registerDto: RegisterDto): Promise<any> {
    const { name, email, password, role } = registerDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Map password to passwordHash (the pre-save hook will hash it)
    const newUser = new this.userModel({
      name,
      email,
      passwordHash: password, // Pre-save hook does hashing
      role: role || 'user',
    });

    const savedUser = await newUser.save();
    return {
      id: savedUser._id.toString(),
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
    };
  }

  // Validate credentials
  async validateUser(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // Handle Login and generate JWT
  async login(user: any): Promise<any> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'super-secret-key-change-in-production',
    );
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '7d',
    });

    // Store refresh token in user document
    await this.userModel
      .findByIdAndUpdate(user._id, {
        $push: { refreshTokens: refreshToken },
      })
      .exec();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Refresh access token
  async refresh(refreshToken: string): Promise<any> {
    const jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'super-secret-key-change-in-production',
    );
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtSecret,
      });
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: jwtSecret,
        expiresIn: '15m',
      });

      return {
        access_token: accessToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Revoke refresh token (logout)
  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { refreshTokens: refreshToken },
      })
      .exec();
  }

  // Create API Key
  async createApiKey(
    userId: string,
    name: string,
  ): Promise<{ rawKey: string; key: ApiKey }> {
    const randomKey = generateRandomString(32);
    const rawKey = `sg_live_${randomKey}`;
    const keyPrefix = `sg_live_${randomKey.slice(0, 4)}`;
    const keyHash = sha256(rawKey);

    const apiKey = new this.apiKeyModel({
      name,
      keyPrefix,
      keyHash,
      userId,
      status: 'active',
    });

    const savedKey = await apiKey.save();
    return {
      rawKey,
      key: savedKey.toJSON() as unknown as ApiKey,
    };
  }

  // List API Keys
  async listApiKeys(userId: string): Promise<ApiKey[]> {
    const keys = await this.apiKeyModel.find({ userId }).exec();
    return keys.map((k) => k.toJSON() as unknown as ApiKey);
  }

  // Revoke API Key
  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const result = await this.apiKeyModel
      .updateOne({ _id: keyId, userId }, { $set: { status: 'revoked' } })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException('API Key not found');
    }
  }
}

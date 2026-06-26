import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument } from '../schemas/api-key.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { sha256 } from '@sms-gateway/utils';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
      throw new UnauthorizedException('API Key is missing');
    }

    // Hash the API Key using our shared SHA-256 utility
    const keyHash = sha256(apiKeyHeader);

    // Find the API key in the database
    const apiKeyDoc = await this.apiKeyModel
      .findOne({ keyHash, status: 'active' })
      .exec();
    if (!apiKeyDoc) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Find the associated user
    const user = await this.userModel.findById(apiKeyDoc.userId).exec();
    if (!user) {
      throw new UnauthorizedException('Associated user not found');
    }

    // Attach user to request for downstream handlers
    request.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return true;
  }
}

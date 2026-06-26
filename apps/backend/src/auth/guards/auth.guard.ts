import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const hasApiKey = !!request.headers['x-api-key'];

    if (hasApiKey) {
      return this.apiKeyGuard.canActivate(context);
    }

    // Fallback to JWT Bearer Token validation
    try {
      const canActivateJwt = await this.jwtAuthGuard.canActivate(context);
      return !!canActivateJwt;
    } catch (err) {
      return false;
    }
  }
}

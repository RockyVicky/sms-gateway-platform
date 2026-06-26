import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateKeyDto } from './dto/create-key.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication & API Keys')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new dashboard/API account' })
  @ApiResponse({
    status: 201,
    description: 'User account created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User with this email already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login credentials and return JWT bearer token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access_token and refresh_token',
  })
  @ApiResponse({ status: 401, description: 'Invalid login credentials' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded for login attempts',
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh an expired access token using a refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string', example: 'uuid-refresh-token-hash' },
      },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke and destroy refresh token session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string', example: 'uuid-refresh-token-hash' },
      },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({ status: 204, description: 'Successfully logged out' })
  async logout(
    @CurrentUser() user: any,
    @Body('refresh_token') refreshToken: string,
  ) {
    await this.authService.logout(user.id, refreshToken);
  }

  @Post('keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @ApiOperation({ summary: 'Create a new programmatic client API Key' })
  @ApiResponse({
    status: 201,
    description:
      'API Key generated successfully. Returns plain text API key once.',
  })
  async createKey(
    @CurrentUser() user: any,
    @Body() createKeyDto: CreateKeyDto,
  ) {
    return this.authService.createApiKey(user.id, createKeyDto.name);
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @ApiOperation({ summary: 'List all active and revoked API Keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async listKeys(@CurrentUser() user: any) {
    return this.authService.listApiKeys(user.id);
  }

  @Delete('keys/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke/deactivate an active API Key' })
  @ApiResponse({ status: 204, description: 'API key revoked successfully' })
  async revokeKey(@CurrentUser() user: any, @Param('id') keyId: string) {
    await this.authService.revokeApiKey(user.id, keyId);
  }
}

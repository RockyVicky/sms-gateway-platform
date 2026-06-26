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
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateKeyDto } from './dto/create-key.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: any,
    @Body('refresh_token') refreshToken: string,
  ) {
    await this.authService.logout(user.id, refreshToken);
  }

  @Post('keys')
  @UseGuards(JwtAuthGuard)
  async createKey(
    @CurrentUser() user: any,
    @Body() createKeyDto: CreateKeyDto,
  ) {
    return this.authService.createApiKey(user.id, createKeyDto.name);
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard)
  async listKeys(@CurrentUser() user: any) {
    return this.authService.listApiKeys(user.id);
  }

  @Delete('keys/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeKey(@CurrentUser() user: any, @Param('id') keyId: string) {
    await this.authService.revokeApiKey(user.id, keyId);
  }
}

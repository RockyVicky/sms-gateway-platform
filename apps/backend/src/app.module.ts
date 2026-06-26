import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { SmsModule } from './sms/sms.module';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: [
          'req.headers.authorization',
          'req.headers["x-api-key"]',
          'req.body.password',
        ],
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/sms-gateway',
        ),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // 1 minute
        limit: 100, // max 100 requests per minute globally per IP
      },
      {
        name: 'login',
        ttl: 60000, // 1 minute
        limit: 10, // max 10 login requests per minute per IP (prevent brute force)
      },
      {
        name: 'sms',
        ttl: 10000, // 10 seconds
        limit: 5, // max 5 SMS submissions per 10 seconds per IP (prevent flooding)
      },
      {
        name: 'otp',
        ttl: 300000, // 5 minutes
        limit: 3, // max 3 OTP requests per 5 minutes per phone
      },
    ]),
    AuthModule,
    DevicesModule,
    SmsModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

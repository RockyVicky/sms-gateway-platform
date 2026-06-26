import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

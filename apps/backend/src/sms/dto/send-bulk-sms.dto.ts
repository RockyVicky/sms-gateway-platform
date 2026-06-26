import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendBulkSmsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  recipients: string[];

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

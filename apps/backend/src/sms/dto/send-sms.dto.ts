import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({
    description: 'E.164 formatted recipient phone number',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({
    description: 'Text content of the message body',
    example: 'Alert: Your OTP is 123456.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description:
      'Optional specific target device hardware ID. If omitted, backend auto-selects an online device.',
    example: 'device_dev_1',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

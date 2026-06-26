import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendBulkSmsDto {
  @ApiProperty({
    description: 'Array of E.164 formatted recipient phone numbers',
    example: ['+919876543210', '+919876543211'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  recipients: string[];

  @ApiProperty({
    description: 'Text content of the message body',
    example: 'Promo: Use code OFF20 for 20% discount on your next login!',
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

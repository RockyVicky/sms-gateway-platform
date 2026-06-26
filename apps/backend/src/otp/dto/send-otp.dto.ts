import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'E.164 formatted target phone number for OTP delivery',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

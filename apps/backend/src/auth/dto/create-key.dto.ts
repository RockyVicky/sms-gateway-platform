import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKeyDto {
  @ApiProperty({
    description: 'Human-readable label or service identifier for the API key',
    example: 'Staging Server API Link',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

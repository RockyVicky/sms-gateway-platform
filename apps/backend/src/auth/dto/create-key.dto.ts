import { IsNotEmpty, IsString } from 'class-validator';

export class CreateKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

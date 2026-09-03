import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export default class LoginDto {
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase(), {
    toClassOnly: true,
  })
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

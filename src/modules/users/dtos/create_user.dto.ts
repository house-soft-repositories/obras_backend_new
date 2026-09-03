import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class CreateUserDto {
  @Transform(({ value }: { value: string }) => value.trim(), {
    toClassOnly: true,
  })
  @IsString()
  @MinLength(2)
  name: string;

  @Transform(({ value }: { value: string }) => value.trim().toLowerCase(), {
    toClassOnly: true,
  })
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsEnum([UserRole.STAFF, UserRole.USER])
  role: UserRole.STAFF | UserRole.USER;

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

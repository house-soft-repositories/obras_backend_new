import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
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

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: ErrorCodeConstants.USER_INVALID_ORGANIZATIONAL_LINK })
  localidadeId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: ErrorCodeConstants.USER_INVALID_ORGANIZATIONAL_LINK })
  orgaoId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: ErrorCodeConstants.USER_INVALID_ORGANIZATIONAL_LINK })
  setorId?: string;
}

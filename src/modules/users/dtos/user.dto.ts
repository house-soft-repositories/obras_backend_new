import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class UserDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID()
  tenantId: string | null;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

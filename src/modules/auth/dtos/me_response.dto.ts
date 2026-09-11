import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export class TenantBriefDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;
}

export default class MeResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantBriefDto)
  tenant: TenantBriefDto | null;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

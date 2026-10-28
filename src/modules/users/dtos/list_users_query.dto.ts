import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export default class ListUsersQueryDto extends PaginationOptionsDto {
  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;

  @IsOptional()
  @IsUUID()
  readonly orgaoId?: string;

  @IsOptional()
  @IsUUID()
  readonly setorId?: string;
}

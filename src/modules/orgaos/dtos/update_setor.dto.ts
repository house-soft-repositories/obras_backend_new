import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CreateSetorDto from '@/modules/orgaos/dtos/create_setor.dto';

export default class UpdateSetorDto extends PartialType(CreateSetorDto) {
  @IsOptional()
  @IsUUID(undefined, { message: ErrorCodeConstants.SETOR_INVALID_ORGAO })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  orgaoId?: string;
}

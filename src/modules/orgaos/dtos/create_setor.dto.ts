import SetorDto from '@/modules/orgaos/dtos/setor.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export default class CreateSetorDto extends OmitType(SetorDto, [
  'id',
  'orgaoId',
  'ativo',
  'createdAt',
  'updatedAt',
] as const) {
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  @IsString({ message: ErrorCodeConstants.SETOR_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.SETOR_INVALID_NAME })
  declare nome: string;

  @IsOptional()
  @IsBoolean()
  declare ativo?: boolean;
}

import OrgaoDto from '@/modules/orgaos/dtos/orgao.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export default class CreateOrgaoDto extends OmitType(OrgaoDto, [
  'id',
  'ativo',
  'createdAt',
  'updatedAt',
] as const) {
  @Transform(trim, { toClassOnly: true })
  @IsString({ message: ErrorCodeConstants.ORGAO_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.ORGAO_INVALID_NAME })
  declare nome: string;

  @Transform(trim, { toClassOnly: true })
  declare sigla: string | null;

  @Transform(trim, { toClassOnly: true })
  declare responsavel: string | null;

  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    { toClassOnly: true },
  )
  declare email: string | null;

  @Transform(trim, { toClassOnly: true })
  declare telefone: string | null;

  @IsOptional()
  @IsBoolean()
  declare ativo?: boolean;
}

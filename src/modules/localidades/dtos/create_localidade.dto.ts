import LocalidadeDto from '@/modules/localidades/dtos/localidade.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export default class CreateLocalidadeDto extends OmitType(LocalidadeDto, [
  'id',
  'createdAt',
  'updatedAt',
] as const) {
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  @IsString({ message: ErrorCodeConstants.LOCALIDADE_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.LOCALIDADE_INVALID_NAME })
  declare nome: string;

  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toUpperCase() : value,
    { toClassOnly: true },
  )
  @IsString({ message: ErrorCodeConstants.LOCALIDADE_INVALID_UF })
  @Length(2, 2, { message: ErrorCodeConstants.LOCALIDADE_INVALID_UF })
  declare uf: string;

  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  declare codigoIbge: string | null;

  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  declare municipio: string | null;

  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  declare observacoes: string | null;
}

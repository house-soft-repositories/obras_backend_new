import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export default class PastaDto {
  @IsUUID()
  id: string;

  @IsUUID()
  obraId: string;

  @IsOptional()
  @IsUUID()
  pastaPaiId: string | null;

  @IsString({ message: ErrorCodeConstants.PASTA_INVALID_NAME })
  @MinLength(1, { message: ErrorCodeConstants.PASTA_INVALID_NAME })
  @MaxLength(120, { message: ErrorCodeConstants.PASTA_INVALID_NAME })
  nome: string;

  @IsOptional()
  @IsUUID()
  criadoPorUsuarioId: string | null;

  createdAt: Date;

  updatedAt: Date;
}

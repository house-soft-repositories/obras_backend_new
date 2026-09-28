import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export default class ArquivoDto {
  @IsUUID()
  id: string;

  @IsUUID()
  obraId: string;

  @IsUUID()
  pastaId: string;

  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  nome: string;

  @IsOptional()
  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  descricao: string | null;

  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  nomeOriginal: string;

  @IsOptional()
  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  mimeType: string | null;
}

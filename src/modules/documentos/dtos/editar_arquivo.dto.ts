import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { IsOptional, IsString, MinLength } from 'class-validator';

export default class EditarArquivoDto {
  @IsOptional()
  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  @MinLength(1, { message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  nome?: string;

  @IsOptional()
  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  descricao?: string;
}

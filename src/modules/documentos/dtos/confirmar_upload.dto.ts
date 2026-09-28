import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export default class ConfirmarUploadDto {
  @Type(() => Number)
  @IsInt({ message: ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED })
  @Min(0, { message: ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED })
  tamanhoBytes: number;

  @IsOptional()
  @IsString({ message: ErrorCodeConstants.ARQUIVO_CONFIRM_FAILED })
  mimeType?: string;
}

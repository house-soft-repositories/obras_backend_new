import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class IniciarUploadItemDto {
  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  @MinLength(1, { message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  nome: string;

  @IsOptional()
  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  descricao?: string;

  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  @MinLength(1, { message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  nomeOriginal: string;

  @IsString({ message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  @MinLength(1, { message: ErrorCodeConstants.ARQUIVO_INVALID_INPUT })
  mimeType: string;
}

export default class IniciarUploadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IniciarUploadItemDto)
  arquivos: IniciarUploadItemDto[];
}

import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ArquivoUploadItemDto {
  @IsString()
  @MinLength(1)
  nomeOriginal: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsEnum(CategoriaArquivoPrivado)
  categoria?: CategoriaArquivoPrivado;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @IsOptional()
  @IsDateString()
  capturadoEm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordem?: number;
}

export class IniciarUploadArquivoDto {
  @IsEnum(VinculoArquivoPrivado)
  vinculo: VinculoArquivoPrivado;

  @IsOptional()
  @IsUUID()
  vinculoId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ArquivoUploadItemDto)
  arquivos: ArquivoUploadItemDto[];
}

export class ConfirmarUploadArquivoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tamanhoBytes?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class AtualizarArquivoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsEnum(CategoriaArquivoPrivado)
  categoria?: CategoriaArquivoPrivado;
}

export class ListarArquivosQueryDto {
  @IsOptional()
  @IsEnum(VinculoArquivoPrivado)
  vinculo?: VinculoArquivoPrivado;

  @IsOptional()
  @IsUUID()
  vinculoId?: string;

  @IsOptional()
  @IsEnum(CategoriaArquivoPrivado)
  categoria?: CategoriaArquivoPrivado;
}

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
export class CreateEstagioDto {
  @IsString() @MinLength(1) nome!: string;
  @IsOptional() @IsInt() @Min(0) posicao?: number;
  @IsOptional() @IsDateString() dataInicio?: string;
  @IsOptional() @IsDateString() dataFim?: string;
  @IsOptional() @IsUUID() responsavelUsuarioId?: string;
}
export class UpdateEstagioDto {
  @IsOptional() @IsString() @MinLength(1) nome?: string;
  @IsOptional() @IsInt() @Min(0) posicao?: number;
  @IsOptional() @IsDateString() dataInicio?: string;
  @IsOptional() @IsDateString() dataFim?: string;
  @IsOptional() @IsUUID() responsavelUsuarioId?: string;
}
export class CreateEstagiosLoteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEstagioDto)
  itens!: CreateEstagioDto[];
}
export class ReorderItemDto {
  @IsUUID() id!: string;
  @IsInt() @Min(0) posicao!: number;
}
export class ReorderEstagiosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  itens!: ReorderItemDto[];
}
export class CreateAcompanhamentoDto {
  @IsNumber() @Min(0) @Max(100) percentual!: number;
  @IsDateString() data!: string;
  @IsOptional() @IsString() observacao?: string;
}
export class CreateComentarioDto {
  @IsString() @MinLength(1) texto!: string;
}
export class UpdatePercentualDiretoDto {
  @IsNumber() @Min(0) @Max(100) percentual!: number;
}
export class CreateMedicaoFonteDto {
  @IsUUID() fonteId!: string;
  @IsNumber() @Min(0) valor!: number;
}
export class CreateMedicaoDto {
  @IsEnum(TipoMedicao) tipo!: TipoMedicao;
  @IsDateString() dataMedicao!: string;
  @IsOptional() @IsString() observacao?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMedicaoFonteDto)
  itens!: CreateMedicaoFonteDto[];
}

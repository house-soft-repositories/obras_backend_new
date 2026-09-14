import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, MinLength, ValidateNested } from 'class-validator';
export class CreateEstagioDto { @IsString() @MinLength(1) nome!: string; @IsOptional() @IsInt() @Min(0) posicao?: number; @IsOptional() @IsDateString() dataInicio?: string; @IsOptional() @IsDateString() dataFim?: string; @IsOptional() @IsUUID() responsavelUsuarioId?: string; }
export class UpdateEstagioDto { @IsOptional() @IsString() @MinLength(1) nome?: string; @IsOptional() @IsInt() @Min(0) posicao?: number; @IsOptional() @IsDateString() dataInicio?: string; @IsOptional() @IsDateString() dataFim?: string; @IsOptional() @IsUUID() responsavelUsuarioId?: string; }
export class CreateEstagiosLoteDto { @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>CreateEstagioDto) itens!: CreateEstagioDto[]; }
export class ReorderItemDto { @IsUUID() id!: string; @IsInt() @Min(0) posicao!: number; }
export class ReorderEstagiosDto { @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>ReorderItemDto) itens!: ReorderItemDto[]; }

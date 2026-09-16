import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';
import { TipoEmpenho } from '@/modules/obras/domain/enums/tipo_empenho.enum';

export class CriarEmpenhoDto {
  @IsUUID() fonteId!: string;
  @IsEnum(TipoEmpenho) tipo!: TipoEmpenho;
  @IsString() @MinLength(1) numero!: string;
  @IsDateString() dataEmpenho!: string;
  @IsNumber() @IsPositive() valor!: number;
  @IsOptional() @IsString() observacoes?: string;
}

export class AtualizarEmpenhoDto {
  @IsOptional() @IsUUID() fonteId?: string;
  @IsOptional() @IsEnum(TipoEmpenho) tipo?: TipoEmpenho;
  @IsOptional() @IsString() @MinLength(1) numero?: string;
  @IsOptional() @IsDateString() dataEmpenho?: string;
  @IsOptional() @IsNumber() @IsPositive() valor?: number;
  @IsOptional() @IsString() observacoes?: string;
}

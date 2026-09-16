import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarPagamentoDto {
  @IsUUID() empenhoId!: string;
  @IsUUID() liquidacaoId!: string;
  @IsUUID() fonteId!: string;
  @IsString() @MinLength(1) numeroOrdemBancaria!: string;
  @IsDateString() dataOrdemBancaria!: string;
  @IsNumber() @IsPositive() valor!: number;
  @IsOptional() @IsString() observacoes?: string;
}

export class AtualizarPagamentoDto {
  @IsOptional() @IsUUID() fonteId?: string;
  @IsOptional() @IsString() @MinLength(1) numeroOrdemBancaria?: string;
  @IsOptional() @IsDateString() dataOrdemBancaria?: string;
  @IsOptional() @IsNumber() @IsPositive() valor?: number;
  @IsOptional() @IsString() observacoes?: string;
}

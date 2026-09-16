import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarLiquidacaoDto {
  @IsUUID() empenhoId!: string;
  @IsUUID() fonteId!: string;
  @IsString() @MinLength(1) numero!: string;
  @IsDateString() dataLiquidacao!: string;
  @IsNumber() @IsPositive() valor!: number;
  @IsOptional() @IsString() observacoes?: string;
}

export class AtualizarLiquidacaoDto {
  @IsOptional() @IsUUID() fonteId?: string;
  @IsOptional() @IsString() @MinLength(1) numero?: string;
  @IsOptional() @IsDateString() dataLiquidacao?: string;
  @IsOptional() @IsNumber() @IsPositive() valor?: number;
  @IsOptional() @IsString() observacoes?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';
export default class CriarAditivoDto {
  @ApiProperty() @IsString() @MinLength(1) numero!: string;
  @ApiProperty({ enum: TipoAditivo }) @IsEnum(TipoAditivo) tipo!: TipoAditivo;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataAssinatura?: string;
  @ApiProperty({ required: false, enum: TipoPrazoExecucao })
  @IsOptional()
  @IsEnum(TipoPrazoExecucao)
  tipoPrazoExecucao?: TipoPrazoExecucao;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  prazoExecucaoDias?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  prazoExecucaoData?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  vigenciaAditivada?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
import { TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';
export class ContratoFonteDto {
  @ApiProperty() @IsUUID() fonteId!: string;
  @ApiProperty() @IsNumberString() valor!: string;
}
export default class CriarContratoDto {
  @ApiProperty() @IsUUID() obraId!: string;
  @ApiProperty() @IsUUID() empresaContratadaId!: string;
  @ApiProperty() @IsString() @MinLength(1) numero!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() objeto?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataAssinatura?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fimVigencia?: string;
  @ApiProperty() @IsDateString() dataOs!: string;
  @ApiProperty({ enum: TipoPrazoExecucao })
  @IsEnum(TipoPrazoExecucao)
  tipoPrazoExecucao!: TipoPrazoExecucao;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  prazoExecucaoDias?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  prazoExecucaoData?: string;
  @ApiProperty({ type: [ContratoFonteDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ContratoFonteDto)
  fontes!: ContratoFonteDto[];
}

export class AtualizarContratoDto extends PartialType(CriarContratoDto) {}

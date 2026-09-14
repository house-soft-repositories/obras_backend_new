import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
export default class CriarParalisacaoDto {
  @ApiProperty() @IsDateString() dataParalisacao!: string;
  @ApiProperty() @IsString() @MinLength(1) motivo!: string;
  @ApiProperty() @IsUUID() termoParalisacaoArquivoId!: string;
}
export class ReinicioParalisacaoDto {
  @ApiProperty() @IsDateString() dataReinicio!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  termoRetomadaArquivoId?: string;
}

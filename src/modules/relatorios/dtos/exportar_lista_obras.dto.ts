import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FormatoExportacaoLista } from '@/modules/relatorios/domain/enums/relatorios.enum';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';

export default class ExportarListaObrasDto extends FiltroObrasDto {
  @ApiPropertyOptional({ enum: FormatoExportacaoLista })
  @IsOptional()
  @IsEnum(FormatoExportacaoLista)
  formato: FormatoExportacaoLista = FormatoExportacaoLista.CSV;
}

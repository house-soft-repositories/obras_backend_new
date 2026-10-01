import ListObrasQueryDto from '@/modules/obras-privadas/dtos/list_obras_query.dto';
import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum FormatoRelatorioObrasPrivadasDto {
  CSV = 'CSV',
  PDF = 'PDF',
}

export default class ExportarObrasPrivadasQueryDto extends OmitType(
  ListObrasQueryDto,
  ['page', 'take', 'order'] as const,
) {
  @IsOptional()
  @Transform(({ value }) => String(value ?? 'CSV').toUpperCase(), {
    toClassOnly: true,
  })
  @IsEnum(FormatoRelatorioObrasPrivadasDto)
  formato: FormatoRelatorioObrasPrivadasDto =
    FormatoRelatorioObrasPrivadasDto.CSV;
}

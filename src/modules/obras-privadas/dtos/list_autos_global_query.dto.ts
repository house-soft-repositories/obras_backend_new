import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import {
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export default class ListAutosGlobalQueryDto extends PaginationOptionsDto {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsEnum(TipoAutoInfracao) tipo?: TipoAutoInfracao;
  @IsOptional() @IsEnum(SituacaoAutoInfracao) situacao?: SituacaoAutoInfracao;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true }) @IsBoolean() vencidos?: boolean;
  @IsOptional() @IsDateString() dataInicio?: string;
  @IsOptional() @IsDateString() dataFim?: string;
}

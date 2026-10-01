import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import {
  ResultadoFiscalizacao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export default class ListFiscalizacoesGlobalQueryDto extends PaginationOptionsDto {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsUUID() fiscalUsuarioId?: string;
  @IsOptional() @IsEnum(TipoFiscalizacao) tipo?: TipoFiscalizacao;
  @IsOptional() @IsEnum(ResultadoFiscalizacao) resultado?: ResultadoFiscalizacao;
  @IsOptional() @IsDateString() dataInicio?: string;
  @IsOptional() @IsDateString() dataFim?: string;
}

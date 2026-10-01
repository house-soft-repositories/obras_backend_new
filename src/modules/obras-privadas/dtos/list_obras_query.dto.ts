import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import {
  AndamentoObraPrivada,
  SituacaoAlvara,
  SituacaoHabiteSe,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export default class ListObrasQueryDto extends PaginationOptionsDto {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsEnum(SituacaoAlvara) situacaoAlvara?: SituacaoAlvara;
  @IsOptional() @IsEnum(AndamentoObraPrivada) andamento?: AndamentoObraPrivada;
  @IsOptional() @IsEnum(SituacaoHabiteSe) habiteSe?: SituacaoHabiteSe;
  @IsOptional() @IsString() bairro?: string;
  @IsOptional() @IsUUID() orgaoId?: string;
  @IsOptional() @IsUUID() localidadeId?: string;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true }) @IsBoolean() autuada?: boolean;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true }) @IsBoolean() embargada?: boolean;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true }) @IsBoolean() fiscalizada?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) semVisitaHaDias?: number;
}

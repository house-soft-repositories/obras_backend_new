import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import {
  SituacaoAlvara,
  SituacaoHabiteSe,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export default class ListLicenciamentoQueryDto extends PaginationOptionsDto {
  @IsOptional() @IsString() busca?: string;
  @IsOptional() @IsEnum(SituacaoAlvara) situacaoAlvara?: SituacaoAlvara;
  @IsOptional() @IsEnum(SituacaoHabiteSe) habiteSe?: SituacaoHabiteSe;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) vencendoEmDias?: number;
}

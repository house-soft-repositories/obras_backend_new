import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '@/core/pagination/dto/page_options.dto';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';

export default class ListObrasQueryDto extends PageOptionsDto {
  @IsOptional()
  @IsEnum(StatusObra)
  status?: StatusObra;

  @IsOptional()
  @IsEnum(TipoObra)
  tipo?: TipoObra;

  @IsOptional()
  @IsUUID()
  orgaoId?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

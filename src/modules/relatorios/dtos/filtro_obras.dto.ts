import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import { ModoExibicaoObras } from '@/modules/relatorios/domain/enums/relatorios.enum';

const paraArray = ({ value }: { value: unknown }) =>
  value == null ? value : Array.isArray(value) ? value : [value];

export default class FiltroObrasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare acaoConveniada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare eixoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare tipologiaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare classificacaoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare empresaExecutora?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare numeroContrato?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  declare prioritaria?: string;

  @ApiPropertyOptional({ enum: TipoObra })
  @IsOptional()
  @IsEnum(TipoObra)
  declare tipo?: TipoObra;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(paraArray, { toClassOnly: true })
  @IsArray()
  @IsUUID('all', { each: true })
  declare tagIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare orgaoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare setorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare localidadeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare responsavel?: string;

  @ApiPropertyOptional({ enum: StatusObra, isArray: true })
  @IsOptional()
  @Transform(paraArray, { toClassOnly: true })
  @IsArray()
  @IsEnum(StatusObra, { each: true })
  declare statusObra?: StatusObra[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare estagioAtual?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  declare percentualMin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  declare percentualMax?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare dataCriacaoDe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare dataCriacaoAte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare prazoEstagioDe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare prazoEstagioAte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare atualizadoDe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare atualizadoAte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare buscaTextual?: string;

  @ApiPropertyOptional({ enum: ModoExibicaoObras })
  @IsOptional()
  @IsEnum(ModoExibicaoObras)
  declare modo?: ModoExibicaoObras;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare pagina?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  declare tamanho?: number;
}

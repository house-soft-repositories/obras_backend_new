import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AcaoConveniada } from '@/modules/obras/domain/enums/acao_conveniada.enum';
import { ModoDuracao } from '@/modules/obras/domain/enums/modo_duracao.enum';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';

export class OrcamentoDto {
  @IsUUID()
  fonteId: string;

  @IsNumberString()
  valor: string;
}

export default class CreateObraDto {
  @IsString({ message: ErrorCodeConstants.OBRA_INVALID_NOME })
  @IsNotEmpty({ message: ErrorCodeConstants.OBRA_INVALID_NOME })
  @MinLength(2, { message: ErrorCodeConstants.OBRA_INVALID_NOME })
  nome: string;

  @IsString({ message: ErrorCodeConstants.OBRA_INVALID_TIPO })
  @IsNotEmpty({ message: ErrorCodeConstants.OBRA_INVALID_TIPO })
  tipo: string;

  @IsUUID(undefined, { message: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL })
  @IsNotEmpty({ message: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL })
  responsavelUsuarioId: string;

  @IsUUID(undefined, { message: ErrorCodeConstants.OBRA_INVALID_ORGAO })
  @IsNotEmpty({ message: ErrorCodeConstants.OBRA_INVALID_ORGAO })
  orgaoId: string;

  @IsOptional()
  @IsUUID()
  setorId?: string;

  @IsOptional()
  @IsUUID()
  localidadeId?: string;

  @IsOptional()
  @IsUUID()
  subclassificacaoId?: string;

  @IsOptional()
  @IsUUID()
  eixoId?: string;

  @IsOptional()
  @IsUUID()
  classificacaoId?: string;

  @IsOptional()
  @IsUUID()
  tipologiaId?: string;

  @IsOptional()
  @IsUUID()
  subtipologiaId?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsEnum(TipoFinanciamento)
  tipoFinanciamento?: TipoFinanciamento;

  @IsOptional()
  @IsEnum(ModoDuracao)
  modoDuracao?: ModoDuracao;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataPrazo?: string;

  @IsOptional()
  @IsEnum(AcaoConveniada)
  acaoConveniada?: AcaoConveniada;

  @IsOptional()
  @IsBoolean()
  prioritaria?: boolean;

  @IsOptional()
  @IsBoolean()
  exibirCameraAoVivo?: boolean;

  @IsOptional()
  @IsString()
  cameraUrl?: string;

  @IsOptional()
  @IsBoolean()
  privado?: boolean;

  @IsOptional()
  @IsBoolean()
  invisivel?: boolean;

  @IsOptional()
  @IsBoolean()
  considerarSabado?: boolean;

  @IsOptional()
  @IsBoolean()
  considerarDomingo?: boolean;

  @IsOptional()
  @IsBoolean()
  seguirAutomatico?: boolean;

  @IsOptional()
  @IsBoolean()
  vincularPagamentoPercentual?: boolean;

  @IsOptional()
  @IsBoolean()
  corresponsaveisPodemEditar?: boolean;

  @IsOptional()
  @IsString()
  programaPpa?: string;

  @IsOptional()
  @IsString()
  acaoEstrategica?: string;

  @IsOptional()
  @IsString()
  acaoOrcamentaria?: string;

  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @IsOptional()
  @IsNumberString()
  quantidade?: string;

  @IsOptional()
  @IsString()
  secretario?: string;

  @IsOptional()
  @IsDateString()
  dataPactuada?: string;

  @IsArray()
  @ArrayMinSize(1, { message: ErrorCodeConstants.OBRA_INVALID_ORCAMENTO })
  @ValidateNested({ each: true })
  @Type(() => OrcamentoDto)
  orcamentos: OrcamentoDto[];
}

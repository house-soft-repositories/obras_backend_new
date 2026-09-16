import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { AcaoConveniada } from '@/modules/obras/domain/enums/acao_conveniada.enum';
import { ModoDuracao } from '@/modules/obras/domain/enums/modo_duracao.enum';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';

export interface CreateObraParam {
  nome: string;
  tipo: string;
  orgaoId: string;
  setorId?: string | null;
  localidadeId?: string | null;
  subclassificacaoId?: string | null;
  eixoId?: string | null;
  classificacaoId?: string | null;
  tipologiaId?: string | null;
  subtipologiaId?: string | null;
  descricao?: string | null;
  tipoFinanciamento?: TipoFinanciamento;
  modoDuracao?: ModoDuracao;
  dataInicio?: string | null;
  dataPrazo?: string | null;
  acaoConveniada?: AcaoConveniada;
  prioritaria?: boolean;
  exibirCameraAoVivo?: boolean;
  cameraUrl?: string | null;
  privado?: boolean;
  invisivel?: boolean;
  considerarSabado?: boolean;
  considerarDomingo?: boolean;
  seguirAutomatico?: boolean;
  vincularPagamentoPercentual?: boolean;
  corresponsaveisPodemEditar?: boolean;
  programaPpa?: string | null;
  acaoEstrategica?: string | null;
  acaoOrcamentaria?: string | null;
  unidadeMedida?: string | null;
  quantidade?: string | null;
  secretario?: string | null;
  dataPactuada?: string | null;
  responsavelUsuarioId: string;
  orcamentos: { fonteId: string; valor: string }[];
  criadoPorUsuarioId: string;
  tenantId: string;
}

type ICreateObraUseCase = UseCase<CreateObraParam, ObraEntity>;
export default ICreateObraUseCase;

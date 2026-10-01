import UseCase from '@/core/types/use_case';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import {
  EtapaObraPrivada,
  LocalEntulho,
  ResultadoFiscalizacao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type CreateFiscalizacaoParam = {
  tenantId: string;
  obraPrivadaId: string;
  tipo: TipoFiscalizacao;
  dataFiscalizacao: string;
  fiscalUsuarioId: string;
  resultado: ResultadoFiscalizacao;
  etapaConstatada?: EtapaObraPrivada | null;
  constatacoes?: string | null;
  providencias?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  entulhoHaIrregularidade?: boolean | null;
  entulhoVolumeEstimadoM3?: string | null;
  entulhoLocal?: LocalEntulho | null;
  entulhoPossuiCacamba?: boolean | null;
  entulhoPossuiPgrcc?: boolean | null;
  entulhoDestinacao?: string | null;
};

type ICreateFiscalizacaoUseCase = UseCase<
  CreateFiscalizacaoParam,
  FiscalizacaoEntity
>;
export default ICreateFiscalizacaoUseCase;

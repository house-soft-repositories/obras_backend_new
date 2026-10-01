import UseCase from '@/core/types/use_case';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import {
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type CreateAutoInfracaoParam = {
  tenantId: string;
  obraPrivadaId: string;
  fiscalizacaoId?: string | null;
  tipo: TipoAutoInfracao;
  dataEmissao: string;
  prazoDias?: number | null;
  baseLegal?: string | null;
  descricao: string;
  valorMulta?: string | null;
  situacao?: SituacaoAutoInfracao;
  dataEncerramento?: string | null;
  observacoes?: string | null;
  lavradoPorUsuarioId: string;
};
type ICreateAutoInfracaoUseCase = UseCase<
  CreateAutoInfracaoParam,
  AutoInfracaoEntity
>;
export default ICreateAutoInfracaoUseCase;

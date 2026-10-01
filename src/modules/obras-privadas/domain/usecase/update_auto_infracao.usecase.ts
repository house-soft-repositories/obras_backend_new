import UseCase from '@/core/types/use_case';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import { CreateAutoInfracaoParam } from '@/modules/obras-privadas/domain/usecase/create_auto_infracao.usecase';
export type UpdateAutoInfracaoParam = { id: string } & Partial<
  Omit<
    CreateAutoInfracaoParam,
    'tenantId' | 'obraPrivadaId' | 'lavradoPorUsuarioId'
  >
>;
type IUpdateAutoInfracaoUseCase = UseCase<
  UpdateAutoInfracaoParam,
  AutoInfracaoEntity
>;
export default IUpdateAutoInfracaoUseCase;

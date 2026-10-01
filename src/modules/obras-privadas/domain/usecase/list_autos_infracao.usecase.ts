import UseCase from '@/core/types/use_case';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
export type ListAutosInfracaoParam = { obraPrivadaId: string };
type IListAutosInfracaoUseCase = UseCase<
  ListAutosInfracaoParam,
  AutoInfracaoEntity[]
>;
export default IListAutosInfracaoUseCase;

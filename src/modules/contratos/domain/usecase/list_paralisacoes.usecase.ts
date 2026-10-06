import type UseCase from '@/core/types/use_case';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';

export interface ListParalisacoesParam {
  contratoId: string;
}

type IListParalisacoesUseCase = UseCase<
  ListParalisacoesParam,
  ParalisacaoEntity[]
>;

export default IListParalisacoesUseCase;

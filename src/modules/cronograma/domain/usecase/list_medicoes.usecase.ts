import type UseCase from '@/core/types/use_case';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';

export interface ListMedicoesParam {
  obraId: string;
  options: PageOptionsEntity;
}

type IListMedicoesUseCase = UseCase<
  ListMedicoesParam,
  PageEntity<MedicaoEntity>
>;
export default IListMedicoesUseCase;

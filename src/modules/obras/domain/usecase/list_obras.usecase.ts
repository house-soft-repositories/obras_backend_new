import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';

export interface ListObrasParam {
  status?: string;
  tipo?: string;
  orgaoId?: string;
  q?: string;
  pageOptions: PageOptionsEntity;
}

type IListObrasUseCase = UseCase<ListObrasParam, PageEntity<ObraEntity>>;
export default IListObrasUseCase;

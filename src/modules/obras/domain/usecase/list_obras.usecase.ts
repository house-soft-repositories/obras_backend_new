import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';

export interface ListObrasParam {
  status?: StatusObra;
  tipo?: TipoObra;
  orgaoId?: string;
  q?: string;
  pageOptions: PageOptionsEntity;
}

type IListObrasUseCase = UseCase<ListObrasParam, PageEntity<ObraEntity>>;
export default IListObrasUseCase;

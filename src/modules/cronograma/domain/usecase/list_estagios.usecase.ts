import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface ListEstagiosParam {
  obraId: string;
  options: PageOptionsEntity;
}

type IListEstagiosUseCase = UseCase<
  ListEstagiosParam,
  PageEntity<EstagioEntity>
>;
export default IListEstagiosUseCase;

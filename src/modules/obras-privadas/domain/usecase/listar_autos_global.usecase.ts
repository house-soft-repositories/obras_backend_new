import PageEntity from '@/core/pagination/domain/entities/page.entity';
import UseCase from '@/core/types/use_case';
import { AutoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/auto_global_read_model';
import { ListAutosGlobalQuery } from '@/modules/obras-privadas/infra/query/list_autos_global.query';

export type ListarAutosGlobalParam = ListAutosGlobalQuery & {
  page: number;
  take: number;
  order: 'ASC' | 'DESC';
};

type IListarAutosGlobalUseCase = UseCase<
  ListarAutosGlobalParam,
  PageEntity<AutoGlobalReadModel>
>;
export default IListarAutosGlobalUseCase;

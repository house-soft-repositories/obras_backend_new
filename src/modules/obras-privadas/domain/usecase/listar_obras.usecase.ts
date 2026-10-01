import PageEntity from '@/core/pagination/domain/entities/page.entity';
import UseCase from '@/core/types/use_case';
import { ObraPrivadaListReadModel } from '@/modules/obras-privadas/infra/read-models/obra_privada_list_read_model';
import { ListObrasQuery } from '@/modules/obras-privadas/infra/query/list_obras.query';

export type ListarObrasParam = ListObrasQuery & {
  page: number;
  take: number;
  order: 'ASC' | 'DESC';
};

type IListarObrasUseCase = UseCase<
  ListarObrasParam,
  PageEntity<ObraPrivadaListReadModel>
>;
export default IListarObrasUseCase;

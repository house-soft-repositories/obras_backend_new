import PageEntity from '@/core/pagination/domain/entities/page.entity';
import UseCase from '@/core/types/use_case';
import { LicenciamentoListReadModel } from '@/modules/obras-privadas/infra/read-models/licenciamento_list_read_model';
import { ListLicenciamentoQuery } from '@/modules/obras-privadas/infra/query/list_licenciamento.query';

export type ListarLicenciamentoParam = ListLicenciamentoQuery & {
  page: number;
  take: number;
  order: 'ASC' | 'DESC';
};

type IListarLicenciamentoUseCase = UseCase<
  ListarLicenciamentoParam,
  PageEntity<LicenciamentoListReadModel>
>;
export default IListarLicenciamentoUseCase;

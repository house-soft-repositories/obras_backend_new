import PageEntity from '@/core/pagination/domain/entities/page.entity';
import UseCase from '@/core/types/use_case';
import { FiscalizacaoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/fiscalizacao_global_read_model';
import { ListFiscalizacoesGlobalQuery } from '@/modules/obras-privadas/infra/query/list_fiscalizacoes_global.query';

export type ListarFiscalizacoesGlobalParam = ListFiscalizacoesGlobalQuery & {
  page: number;
  take: number;
  order: 'ASC' | 'DESC';
};

type IListarFiscalizacoesGlobalUseCase = UseCase<
  ListarFiscalizacoesGlobalParam,
  PageEntity<FiscalizacaoGlobalReadModel>
>;
export default IListarFiscalizacoesGlobalUseCase;

import UseCase from '@/core/types/use_case';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';

export type ListFiscalizacoesParam = { obraPrivadaId: string };

type IListFiscalizacoesUseCase = UseCase<
  ListFiscalizacoesParam,
  FiscalizacaoEntity[]
>;
export default IListFiscalizacoesUseCase;

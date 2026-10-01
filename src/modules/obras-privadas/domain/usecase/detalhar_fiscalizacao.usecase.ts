import UseCase from '@/core/types/use_case';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';

export type DetalharFiscalizacaoParam = { id: string };

type IDetalharFiscalizacaoUseCase = UseCase<
  DetalharFiscalizacaoParam,
  FiscalizacaoEntity
>;
export default IDetalharFiscalizacaoUseCase;

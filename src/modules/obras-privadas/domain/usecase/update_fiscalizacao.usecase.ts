import UseCase from '@/core/types/use_case';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import { CreateFiscalizacaoParam } from '@/modules/obras-privadas/domain/usecase/create_fiscalizacao.usecase';

export type UpdateFiscalizacaoParam = { id: string } & Partial<
  Omit<
    CreateFiscalizacaoParam,
    'tenantId' | 'obraPrivadaId' | 'fiscalUsuarioId'
  >
>;

type IUpdateFiscalizacaoUseCase = UseCase<
  UpdateFiscalizacaoParam,
  FiscalizacaoEntity
>;
export default IUpdateFiscalizacaoUseCase;

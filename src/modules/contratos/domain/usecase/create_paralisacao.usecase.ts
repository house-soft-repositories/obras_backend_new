import type UseCase from '@/core/types/use_case';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';

export interface CreateParalisacaoParam {
  contratoId: string;
  dataParalisacao: string;
  motivo: string;
  termoParalisacaoArquivoId: string;
}

type ICreateParalisacaoUseCase = UseCase<
  CreateParalisacaoParam,
  ParalisacaoEntity
>;

export default ICreateParalisacaoUseCase;

import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import type { CreateEstagioParam } from '@/modules/cronograma/domain/usecase/create_estagio.usecase';

export interface CreateEstagiosLoteParam {
  obraId: string;
  itens: CreateEstagioParam[];
}

type ICreateEstagiosLoteUseCase = UseCase<
  CreateEstagiosLoteParam,
  EstagioEntity[]
>;
export default ICreateEstagiosLoteUseCase;

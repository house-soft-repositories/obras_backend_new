import type UseCase from '@/core/types/use_case';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export interface UpdatePercentualDiretoParam {
  obraId: string;
  id: string;
  percentual: number;
}

type IUpdatePercentualDiretoUseCase = UseCase<
  UpdatePercentualDiretoParam,
  EstagioEntity
>;
export default IUpdatePercentualDiretoUseCase;

import type UseCase from '@/core/types/use_case';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';

export interface ListAditivosParam {
  contratoId: string;
}

type IListAditivosUseCase = UseCase<ListAditivosParam, AditivoEntity[]>;

export default IListAditivosUseCase;

import type UseCase from '@/core/types/use_case';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';

export interface GetAditivoParam {
  id: string;
}

type IGetAditivoUseCase = UseCase<GetAditivoParam, AditivoEntity>;

export default IGetAditivoUseCase;

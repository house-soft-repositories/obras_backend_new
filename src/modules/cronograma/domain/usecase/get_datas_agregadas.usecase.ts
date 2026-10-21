import type UseCase from '@/core/types/use_case';
import DataAgregadasReadModel from '@/modules/cronograma/domain/read_models/data_agregadas.read_model';

export interface GetDatasAgregadasParam {
  obraId: string;
}

type IGetDatasAgregadasUseCase = UseCase<
  GetDatasAgregadasParam,
  DataAgregadasReadModel
>;
export default IGetDatasAgregadasUseCase;

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import DataAgregadasReadModel from '@/modules/cronograma/domain/read_models/data_agregadas.read_model';
import IGetDatasAgregadasUseCase, { GetDatasAgregadasParam } from '@/modules/cronograma/domain/usecase/get_datas_agregadas.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class GetDatasAgregadasService implements IGetDatasAgregadasUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(
    param: GetDatasAgregadasParam,
  ): AsyncResult<AppException, DataAgregadasReadModel> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.repository.datasAgregadas(param.obraId);
  }
}

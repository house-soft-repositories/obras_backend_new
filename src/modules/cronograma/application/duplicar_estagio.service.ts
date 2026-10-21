import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import IDuplicarEstagioUseCase, { DuplicarEstagioParam } from '@/modules/cronograma/domain/usecase/duplicar_estagio.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class DuplicarEstagioService implements IDuplicarEstagioUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(param: DuplicarEstagioParam): AsyncResult<AppException, EstagioEntity> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    const found = await this.repository.findById(param.id, param.obraId);
    if (found.isLeft()) return left(found.value);
    const position = await this.repository.nextPosicao(param.obraId);
    if (position.isLeft()) return left(position.value);
    try {
      return this.repository.save(found.value.duplicar(position.value));
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_SERVICE_FAILED,
          cause: error,
        }),
      );
    }
  }
}

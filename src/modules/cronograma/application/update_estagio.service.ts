import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import IUpdateEstagioUseCase, { UpdateEstagioParam } from '@/modules/cronograma/domain/usecase/update_estagio.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class UpdateEstagioService implements IUpdateEstagioUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(param: UpdateEstagioParam): AsyncResult<AppException, EstagioEntity> {
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
    if (param.estagioPaiId) {
      if (param.estagioPaiId === param.id)
        return left(
          new CronogramaServiceException({
            code: ErrorCodeConstants.CRONOGRAMA_ESTAGIO_PAI_INVALID,
            statusCode: 400,
          }),
        );
      const parent = await this.repository.findById(param.estagioPaiId, param.obraId);
      if (parent.isLeft()) return left(parent.value);
      if (parent.value.estagioPaiId !== null)
        return left(
          new CronogramaServiceException({
            code: ErrorCodeConstants.CRONOGRAMA_ESTAGIO_PAI_INVALID,
            statusCode: 400,
          }),
        );
      const children = await this.repository.hasChildren(param.obraId, param.id);
      if (children.isLeft()) return left(children.value);
      if (children.value)
        return left(
          new CronogramaServiceException({
            code: ErrorCodeConstants.CRONOGRAMA_ESTAGIO_PAI_INVALID,
            statusCode: 400,
          }),
        );
    }
    try {
      return this.repository.update(found.value.update(param));
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

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import IListEstagiosUseCase, { ListEstagiosParam } from '@/modules/cronograma/domain/usecase/list_estagios.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class ListEstagiosService implements IListEstagiosUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(
    param: ListEstagiosParam,
  ): AsyncResult<AppException, PageEntity<EstagioEntity>> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.repository.list(param.obraId, param.options);
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import { type Unit } from '@/core/types/unit';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import IReorderEstagiosUseCase, {
  ReorderEstagiosParam,
} from '@/modules/cronograma/domain/usecase/reorder_estagios.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class ReorderEstagiosService implements IReorderEstagiosUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(param: ReorderEstagiosParam): AsyncResult<AppException, Unit> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.repository.reorder(param.obraId, param.itens);
  }
}

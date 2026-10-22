import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import IUpdatePercentualDiretoUseCase, {
  UpdatePercentualDiretoParam,
} from '@/modules/cronograma/domain/usecase/update_percentual_direto.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class UpdatePercentualDiretoService
  implements IUpdatePercentualDiretoUseCase
{
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(
    param: UpdatePercentualDiretoParam,
  ): AsyncResult<AppException, EstagioEntity> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    if (param.percentual < 0 || param.percentual > 100)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
          statusCode: 400,
        }),
      );
    return this.repository.updatePercentualDireto(
      param.obraId,
      param.id,
      param.percentual,
    );
  }
}

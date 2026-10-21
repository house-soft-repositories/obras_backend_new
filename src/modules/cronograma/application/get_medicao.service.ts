import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IGetMedicaoUseCase, { GetMedicaoParam } from '@/modules/cronograma/domain/usecase/get_medicao.usecase';

export default class GetMedicaoService implements IGetMedicaoUseCase {
  constructor(
    private readonly repo: IMedicaoRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(param: GetMedicaoParam): AsyncResult<AppException, MedicaoEntity> {
    const obra = await this.ensureObra(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    return this.repo.findById(param.obraId, param.id);
  }

  private async ensureObra(obraId: string): AsyncResult<AppException, Unit> {
    const obra = await this.obras.findById(obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value) {
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(unit);
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IRemoveMedicaoUseCase, { RemoveMedicaoParam } from '@/modules/cronograma/domain/usecase/remove_medicao.usecase';

export default class RemoveMedicaoService implements IRemoveMedicaoUseCase {
  constructor(
    private readonly repo: IMedicaoRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(param: RemoveMedicaoParam): AsyncResult<AppException, Unit> {
    const found = await this.get(param.obraId, param.id);
    if (found.isLeft()) return left(found.value);
    return this.repo.remove(param.obraId, param.id);
  }

  private async get(obraId: string, id: string): AsyncResult<AppException, MedicaoEntity> {
    const obra = await this.ensureObra(obraId);
    if (obra.isLeft()) return left(obra.value);
    return this.repo.findById(obraId, id);
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

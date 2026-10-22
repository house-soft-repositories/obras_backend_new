import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IListMedicoesUseCase, {
  ListMedicoesParam,
} from '@/modules/cronograma/domain/usecase/list_medicoes.usecase';

export default class ListMedicoesService implements IListMedicoesUseCase {
  constructor(
    private readonly repo: IMedicaoRepository,
    private readonly obras: IObraRepository,
  ) {}

  async execute(
    param: ListMedicoesParam,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>> {
    const obra = await this.ensureObra(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    return this.repo.list(param.obraId, param.options);
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

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IResumirAutosUseCase, {
  ResumirAutosParam,
} from '@/modules/obras-privadas/domain/usecase/resumir_autos.usecase';

export default class ResumirAutosService implements IResumirAutosUseCase {
  constructor(private readonly autos: IAutoInfracaoRepository) {}

  async execute(
    _param: ResumirAutosParam,
  ): AsyncResult<AppException, Record<string, number>> {
    return this.autos.countByTipo();
  }
}

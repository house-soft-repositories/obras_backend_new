import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import IListAutosInfracaoUseCase, {
  ListAutosInfracaoParam,
} from '@/modules/obras-privadas/domain/usecase/list_autos_infracao.usecase';
export default class ListAutosInfracaoService implements IListAutosInfracaoUseCase {
  constructor(private readonly autoRepository: IAutoInfracaoRepository) {}
  async execute(
    param: ListAutosInfracaoParam,
  ): AsyncResult<AppException, AutoInfracaoEntity[]> {
    return this.autoRepository.findByObraPrivadaId(param.obraPrivadaId);
  }
}

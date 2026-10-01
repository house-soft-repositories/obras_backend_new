import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import IListHabiteSeUseCase, {
  ListHabiteSeParam,
} from '@/modules/obras-privadas/domain/usecase/list_habite_se.usecase';
export default class ListHabiteSeService implements IListHabiteSeUseCase {
  constructor(private readonly habiteSeRepository: IHabiteSeRepository) {}
  async execute(
    param: ListHabiteSeParam,
  ): AsyncResult<AppException, HabiteSeEntity[]> {
    return this.habiteSeRepository.findByObraPrivadaId(param.obraPrivadaId);
  }
}

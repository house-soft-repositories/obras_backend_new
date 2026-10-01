import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import IListAlvarasUseCase, {
  ListAlvarasParam,
} from '@/modules/obras-privadas/domain/usecase/list_alvaras.usecase';

export default class ListAlvarasService implements IListAlvarasUseCase {
  constructor(private readonly alvaraRepository: IAlvaraRepository) {}

  async execute(
    param: ListAlvarasParam,
  ): AsyncResult<AppException, AlvaraEntity[]> {
    return this.alvaraRepository.findByObraPrivadaId(param.obraPrivadaId);
  }
}

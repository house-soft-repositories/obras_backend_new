import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import IListObrasNoMesmoImovelUseCase, {
  ListObrasNoMesmoImovelParam,
} from '@/modules/obras-privadas/domain/usecase/list_obras_no_mesmo_imovel.usecase';

export default class ListObrasNoMesmoImovelService implements IListObrasNoMesmoImovelUseCase {
  constructor(private readonly obraPrivadaRepository: IObraPrivadaRepository) {}
  async execute(
    param: ListObrasNoMesmoImovelParam,
  ): AsyncResult<AppException, ObraPrivadaEntity[]> {
    return this.obraPrivadaRepository.findNoMesmoImovel(param.id);
  }
}

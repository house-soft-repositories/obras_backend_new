import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import IListObraPrivadaResponsaveisUseCase, {
  ListObraPrivadaResponsaveisParam,
} from '@/modules/obras-privadas/domain/usecase/list_obra_privada_responsaveis.usecase';

export default class ListObraPrivadaResponsaveisService implements IListObraPrivadaResponsaveisUseCase {
  constructor(
    private readonly responsavelRepository: IObraPrivadaResponsavelRepository,
  ) {}
  async execute(
    param: ListObraPrivadaResponsaveisParam,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity[]> {
    return this.responsavelRepository.findByObraPrivadaId(param.obraPrivadaId);
  }
}

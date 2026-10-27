import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import { ObraPrivadaResponsaveisResponse } from '@/modules/obras-privadas/domain/usecase/obra_privada_responsavel.response';
import IListObraPrivadaResponsaveisUseCase, {
  ListObraPrivadaResponsaveisParam,
} from '@/modules/obras-privadas/domain/usecase/list_obra_privada_responsaveis.usecase';

export default class ListObraPrivadaResponsaveisService
  implements IListObraPrivadaResponsaveisUseCase
{
  constructor(
    private readonly responsavelRepository: IObraPrivadaResponsavelRepository,
  ) {}
  async execute(
    param: ListObraPrivadaResponsaveisParam,
  ): AsyncResult<AppException, ObraPrivadaResponsaveisResponse> {
    const found = await this.responsavelRepository.findByObraPrivadaId(
      param.obraPrivadaId,
    );
    return found.map((value) => new ObraPrivadaResponsaveisResponse(value));
  }
}

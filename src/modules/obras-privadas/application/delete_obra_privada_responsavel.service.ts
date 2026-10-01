import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import { left } from '@/core/types/either';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import IDeleteObraPrivadaResponsavelUseCase, {
  DeleteObraPrivadaResponsavelParam,
} from '@/modules/obras-privadas/domain/usecase/delete_obra_privada_responsavel.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class DeleteObraPrivadaResponsavelService implements IDeleteObraPrivadaResponsavelUseCase {
  constructor(
    private readonly responsavelRepository: IObraPrivadaResponsavelRepository,
  ) {}
  async execute(
    param: DeleteObraPrivadaResponsavelParam,
  ): AsyncResult<AppException, Unit> {
    const found = await this.responsavelRepository.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return this.responsavelRepository.delete(param.id);
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import IUpdateObraPrivadaResponsavelUseCase, {
  UpdateObraPrivadaResponsavelParam,
} from '@/modules/obras-privadas/domain/usecase/update_obra_privada_responsavel.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class UpdateObraPrivadaResponsavelService implements IUpdateObraPrivadaResponsavelUseCase {
  constructor(
    private readonly responsavelRepository: IObraPrivadaResponsavelRepository,
  ) {}
  async execute(
    param: UpdateObraPrivadaResponsavelParam,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity> {
    const { id, ...props } = param;
    const updated = await this.responsavelRepository.update(id, props);
    if (updated.isLeft()) return left(updated.value);
    if (!updated.value)
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(updated.value);
  }
}

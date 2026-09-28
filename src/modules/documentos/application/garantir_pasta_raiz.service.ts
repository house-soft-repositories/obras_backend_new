import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import IGarantirPastaRaizUseCase, {
  GarantirPastaRaizParam,
} from '@/modules/documentos/domain/usecase/garantir_pasta_raiz.usecase';
import PastaDomainException from '@/modules/documentos/exceptions/pasta_domain.exception';
import PastaServiceException from '@/modules/documentos/exceptions/pasta_service.exception';

export default class GarantirPastaRaizService implements IGarantirPastaRaizUseCase {
  constructor(private readonly repo: IPastaRepository) {}

  async execute(
    param: GarantirPastaRaizParam,
  ): AsyncResult<AppException, PastaEntity> {
    try {
      const found = await this.repo.findRootByObraId(param.obraId);
      if (found.isLeft()) return left(found.value);
      if (found.value) return right(found.value);
      const entity = PastaEntity.createRoot(param.obraId);
      return this.repo.save(entity);
    } catch (error) {
      if (error instanceof PastaDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new PastaServiceException({
          code: ErrorCodeConstants.PASTA_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

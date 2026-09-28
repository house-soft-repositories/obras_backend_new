import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import ICriarPastaUseCase, {
  CriarPastaParam,
} from '@/modules/documentos/domain/usecase/criar_pasta.usecase';
import PastaDomainException from '@/modules/documentos/exceptions/pasta_domain.exception';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import PastaServiceException from '@/modules/documentos/exceptions/pasta_service.exception';

export default class CriarPastaService implements ICriarPastaUseCase {
  constructor(private readonly repo: IPastaRepository) {}

  async execute(param: CriarPastaParam): AsyncResult<AppException, PastaEntity> {
    try {
      const pai = await this.repo.findById(param.pastaPaiId);
      if (pai.isLeft()) return left(pai.value);
      if (!pai.value)
        return left(
          new PastaRepositoryException({
            code: ErrorCodeConstants.PASTA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const sibling = await this.repo.findSiblingByName(
        pai.value.obraId,
        pai.value.id,
        param.nome.trim(),
      );
      if (sibling.isLeft()) return left(sibling.value);
      if (sibling.value)
        return left(
          new PastaServiceException({
            code: ErrorCodeConstants.PASTA_DUPLICATE_NAME,
            statusCode: 409,
          }),
        );
      const entity = PastaEntity.create({
        obraId: pai.value.obraId,
        pastaPaiId: pai.value.id,
        nome: param.nome,
        criadoPorUsuarioId: param.usuarioId,
      });
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

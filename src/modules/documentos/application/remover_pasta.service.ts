import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import IRemoverPastaUseCase, {
  RemoverPastaParam,
} from '@/modules/documentos/domain/usecase/remover_pasta.usecase';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import PastaServiceException from '@/modules/documentos/exceptions/pasta_service.exception';

export default class RemoverPastaService implements IRemoverPastaUseCase {
  constructor(
    private readonly pastas: IPastaRepository,
    private readonly arquivos: IArquivoRepository,
  ) {}

  async execute(param: RemoverPastaParam): AsyncResult<AppException, Unit> {
    try {
      const found = await this.pastas.findById(param.pastaId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new PastaRepositoryException({
            code: ErrorCodeConstants.PASTA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (found.value.pastaPaiId === null)
        return left(
          new PastaServiceException({
            code: ErrorCodeConstants.PASTA_DELETE_FORBIDDEN,
            statusCode: 422,
          }),
        );
      const hasFiles = await this.contemArquivos(found.value);
      if (hasFiles.isLeft()) return left(hasFiles.value);
      if (hasFiles.value)
        return left(
          new PastaServiceException({
            code: ErrorCodeConstants.PASTA_DELETE_FORBIDDEN,
            statusCode: 422,
          }),
        );
      const removed = await this.removerRecursivo(found.value);
      if (removed.isLeft()) return left(removed.value);
      return right(unit);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new PastaServiceException({
          code: ErrorCodeConstants.PASTA_DELETE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async removerRecursivo(
    pasta: PastaEntity,
  ): AsyncResult<AppException, Unit> {
    const subpastas = await this.pastas.findChildren(pasta.id);
    if (subpastas.isLeft()) return left(subpastas.value);
    for (const subpasta of subpastas.value) {
      const removed = await this.removerRecursivo(subpasta);
      if (removed.isLeft()) return left(removed.value);
    }

    const deleted = await this.pastas.deleteById(pasta.id);
    if (deleted.isLeft()) return left(deleted.value);
    return right(unit);
  }

  private async contemArquivos(
    pasta: PastaEntity,
  ): AsyncResult<AppException, boolean> {
    const total = await this.arquivos.countByPastaId(pasta.id);
    if (total.isLeft()) return left(total.value);
    if (total.value > 0) return right(true);

    const subpastas = await this.pastas.findChildren(pasta.id);
    if (subpastas.isLeft()) return left(subpastas.value);
    for (const subpasta of subpastas.value) {
      const hasFiles = await this.contemArquivos(subpasta);
      if (hasFiles.isLeft()) return left(hasFiles.value);
      if (hasFiles.value) return right(true);
    }
    return right(false);
  }
}

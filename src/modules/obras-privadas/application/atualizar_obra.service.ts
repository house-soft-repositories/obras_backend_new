import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import IAtualizarObraUseCase, {
  AtualizarObraParam,
} from '@/modules/obras-privadas/domain/usecase/atualizar_obra.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';

export default class AtualizarObraService implements IAtualizarObraUseCase {
  constructor(
    private readonly obras: IObraPrivadaRepository,
    private readonly pessoas: IPessoaRepository,
  ) {}

  async execute(
    param: AtualizarObraParam,
  ): AsyncResult<AppException, ObraPrivadaEntity> {
    try {
      const { id, ...patch } = param;
      const found = await this.obras.findById(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value || found.value.toObject().deletedAt)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (patch.proprietarioPessoaId !== undefined) {
        const proprietario = await this.pessoas.findById(
          patch.proprietarioPessoaId,
        );
        if (proprietario.isLeft()) return left(proprietario.value);
        if (!proprietario.value)
          return left(
            new ObraPrivadaServiceException({
              code: ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO,
              statusCode: 422,
            }),
          );
      }
      const edited = found.value.editar(patch);
      const updated = await this.obras.update(id, edited.toObject());
      if (updated.isLeft()) return left(updated.value);
      if (!updated.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(updated.value);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

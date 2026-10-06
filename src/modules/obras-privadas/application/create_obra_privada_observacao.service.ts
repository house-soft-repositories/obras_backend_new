import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';
import ICreateObraPrivadaObservacaoUseCase, {
  CreateObraPrivadaObservacaoParam,
} from '@/modules/obras-privadas/domain/usecase/create_obra_privada_observacao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class CreateObraPrivadaObservacaoService implements ICreateObraPrivadaObservacaoUseCase {
  constructor(
    private readonly observacaoRepository: IObraPrivadaObservacaoRepository,
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
  ) {}
  async execute(
    param: CreateObraPrivadaObservacaoParam,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity> {
    try {
      const obra = await this.obraPrivadaRepository.findById(
        param.obraPrivadaId,
      );
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value || obra.value.toObject().deletedAt)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return this.observacaoRepository.save(
        ObraPrivadaObservacaoEntity.create(param),
      );
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_OBSERVACAO_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

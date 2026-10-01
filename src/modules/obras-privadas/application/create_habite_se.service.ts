import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import ICreateHabiteSeUseCase, {
  CreateHabiteSeParam,
} from '@/modules/obras-privadas/domain/usecase/create_habite_se.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
export default class CreateHabiteSeService implements ICreateHabiteSeUseCase {
  constructor(
    private readonly habiteSeRepository: IHabiteSeRepository,
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
  ) {}
  async execute(
    param: CreateHabiteSeParam,
  ): AsyncResult<AppException, HabiteSeEntity> {
    try {
      const obra = await this.obraPrivadaRepository.findById(
        param.obraPrivadaId,
      );
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return this.habiteSeRepository.save(
        HabiteSeEntity.create({
          ...param,
          dataEmissao: param.dataEmissao ?? null,
          parcial: param.parcial ?? false,
          descricaoParcial: param.descricaoParcial ?? null,
          dataVistoria: param.dataVistoria ?? null,
          vistoriadorUsuarioId: param.vistoriadorUsuarioId ?? null,
          fiscalizacaoId: param.fiscalizacaoId ?? null,
          areaConstruidaExecutadaM2: param.areaConstruidaExecutadaM2 ?? null,
          divergenciaProjeto: param.divergenciaProjeto ?? false,
          divergenciaDescricao: param.divergenciaDescricao ?? null,
          parecer: param.parecer ?? null,
          arquivoId: param.arquivoId ?? null,
        }),
      );
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.HABITE_SE_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import ICreateObraPrivadaResponsavelUseCase, {
  CreateObraPrivadaResponsavelParam,
} from '@/modules/obras-privadas/domain/usecase/create_obra_privada_responsavel.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';

export default class CreateObraPrivadaResponsavelService implements ICreateObraPrivadaResponsavelUseCase {
  constructor(
    private readonly responsavelRepository: IObraPrivadaResponsavelRepository,
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
    private readonly profissionalTecnicoRepository: IProfissionalTecnicoRepository,
  ) {}

  async execute(
    param: CreateObraPrivadaResponsavelParam,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity> {
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

      const profissional = await this.profissionalTecnicoRepository.findById(
        param.profissionalTecnicoId,
      );
      if (profissional.isLeft()) return left(profissional.value);
      if (!profissional.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT,
            statusCode: 400,
          }),
        );

      const entity = ObraPrivadaResponsavelEntity.create({
        ...param,
        dataDocumento: param.dataDocumento ?? null,
        arquivoId: param.arquivoId ?? null,
        dataInicio: param.dataInicio ?? null,
        dataBaixa: param.dataBaixa ?? null,
        motivoBaixa: param.motivoBaixa ?? null,
      });
      return this.responsavelRepository.save(entity);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import IUpdateObraPrivadaResponsavelUseCase, {
  UpdateObraPrivadaResponsavelParam,
} from '@/modules/obras-privadas/domain/usecase/update_obra_privada_responsavel.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { ObraPrivadaResponsavelResponse } from '@/modules/obras-privadas/domain/usecase/obra_privada_responsavel.response';

export default class UpdateObraPrivadaResponsavelService
  implements IUpdateObraPrivadaResponsavelUseCase
{
  constructor(
    private readonly responsavelRepository: IObraPrivadaResponsavelRepository,
    private readonly profissionalTecnicoRepository: IProfissionalTecnicoRepository,
  ) {}
  async execute(
    param: UpdateObraPrivadaResponsavelParam,
  ): AsyncResult<AppException, ObraPrivadaResponsavelResponse> {
    try {
      if (
        param.profissionalTecnicoId === null ||
        param.papel === null ||
        param.tipoDocumento === null ||
        param.numeroDocumento === null
      )
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT,
            statusCode: 400,
          }),
        );
      const current = await this.responsavelRepository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      if (!current.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (current.value.obraPrivadaId !== param.obraPrivadaId)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const obraPrivadaId = param.obraPrivadaId ?? current.value.obraPrivadaId;
      const nextProfessionalId =
        param.profissionalTecnicoId === undefined
          ? current.value.profissionalTecnicoId
          : param.profissionalTecnicoId;
      if (param.profissionalTecnicoId !== undefined) {
        const professional =
          await this.profissionalTecnicoRepository.findById(nextProfessionalId);
        if (professional.isLeft()) return left(professional.value);
        if (!professional.value)
          return left(
            new ObraPrivadaServiceException({
              code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT,
              statusCode: 400,
            }),
          );
      }
      const nextRole =
        param.papel === undefined ? current.value.papel : param.papel;
      const nextDataBaixa =
        param.dataBaixa === undefined
          ? current.value.dataBaixa
          : param.dataBaixa;
      const nextMotivoBaixa =
        nextDataBaixa === null
          ? null
          : param.motivoBaixa === undefined
            ? current.value.motivoBaixa
            : param.motivoBaixa;
      const activeDuplicate =
        await this.responsavelRepository.existsActiveByObraPrivadaIdAndPapel(
          obraPrivadaId,
          nextRole,
          param.id,
        );
      if (activeDuplicate.isLeft()) return left(activeDuplicate.value);
      if (!nextDataBaixa && activeDuplicate.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT,
            statusCode: 409,
          }),
        );
      const next = ObraPrivadaResponsavelEntity.create({
        tenantId: current.value.tenantId,
        obraPrivadaId,
        profissionalTecnicoId: nextProfessionalId,
        papel: nextRole,
        tipoDocumento: param.tipoDocumento ?? current.value.tipoDocumento,
        numeroDocumento: param.numeroDocumento ?? current.value.numeroDocumento,
        dataDocumento:
          param.dataDocumento === undefined
            ? current.value.dataDocumento
            : param.dataDocumento,
        arquivoId:
          param.arquivoId === undefined
            ? current.value.arquivoId
            : param.arquivoId,
        dataInicio:
          param.dataInicio === undefined
            ? current.value.dataInicio
            : param.dataInicio,
        dataBaixa: nextDataBaixa,
        motivoBaixa: nextMotivoBaixa,
      });
      const {
        id: _generatedId,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...props
      } = next.toObject();
      const updated = await this.responsavelRepository.update(param.id, props);
      if (updated.isLeft()) return left(updated.value);
      if (!updated.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(new ObraPrivadaResponsavelResponse(updated.value));
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.UNEXPECTED_ERROR,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

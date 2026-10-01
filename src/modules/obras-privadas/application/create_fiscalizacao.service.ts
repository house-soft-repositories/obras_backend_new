import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import ICreateFiscalizacaoUseCase, {
  CreateFiscalizacaoParam,
} from '@/modules/obras-privadas/domain/usecase/create_fiscalizacao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import {
  PREFIXO_FISCALIZACAO,
  proximoCodigo,
} from '@/modules/obras-privadas/services/codigo_privado.service';

export default class CreateFiscalizacaoService implements ICreateFiscalizacaoUseCase {
  constructor(
    private readonly fiscalizacaoRepository: IFiscalizacaoRepository,
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
  ) {}

  async execute(
    param: CreateFiscalizacaoParam,
  ): AsyncResult<AppException, FiscalizacaoEntity> {
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
      const year = new Date(
        `${param.dataFiscalizacao}T00:00:00.000Z`,
      ).getUTCFullYear();
      const lastNumero = await this.fiscalizacaoRepository.findLastNumero(year);
      if (lastNumero.isLeft()) return left(lastNumero.value);
      const entity = FiscalizacaoEntity.create({
        ...param,
        numero: proximoCodigo(PREFIXO_FISCALIZACAO, lastNumero.value, year),
        etapaConstatada: param.etapaConstatada ?? null,
        constatacoes: param.constatacoes ?? null,
        providencias: param.providencias ?? null,
        latitude: param.latitude ?? null,
        longitude: param.longitude ?? null,
        entulhoHaIrregularidade: param.entulhoHaIrregularidade ?? null,
        entulhoVolumeEstimadoM3: param.entulhoVolumeEstimadoM3 ?? null,
        entulhoLocal: param.entulhoLocal ?? null,
        entulhoPossuiCacamba: param.entulhoPossuiCacamba ?? null,
        entulhoPossuiPgrcc: param.entulhoPossuiPgrcc ?? null,
        entulhoDestinacao: param.entulhoDestinacao ?? null,
      });
      return this.fiscalizacaoRepository.save(entity);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.FISCALIZACAO_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

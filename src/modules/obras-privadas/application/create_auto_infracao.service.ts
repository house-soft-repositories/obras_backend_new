import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import ICreateAutoInfracaoUseCase, {
  CreateAutoInfracaoParam,
} from '@/modules/obras-privadas/domain/usecase/create_auto_infracao.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import {
  PREFIXO_AUTO_INFRACAO,
  proximoCodigo,
} from '@/modules/obras-privadas/services/codigo_privado.service';

export default class CreateAutoInfracaoService implements ICreateAutoInfracaoUseCase {
  constructor(
    private readonly autoRepository: IAutoInfracaoRepository,
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
  ) {}
  async execute(
    param: CreateAutoInfracaoParam,
  ): AsyncResult<AppException, AutoInfracaoEntity> {
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
        `${param.dataEmissao}T00:00:00.000Z`,
      ).getUTCFullYear();
      const last = await this.autoRepository.findLastNumero(year);
      if (last.isLeft()) return left(last.value);
      const dataLimite = param.prazoDias
        ? this.addDays(param.dataEmissao, param.prazoDias)
        : null;
      return this.autoRepository.save(
        AutoInfracaoEntity.create({
          ...param,
          numero: proximoCodigo(PREFIXO_AUTO_INFRACAO, last.value, year),
          fiscalizacaoId: param.fiscalizacaoId ?? null,
          prazoDias: param.prazoDias ?? null,
          dataLimite,
          baseLegal: param.baseLegal ?? null,
          valorMulta: param.valorMulta ?? null,
          dataEncerramento: param.dataEncerramento ?? null,
          observacoes: param.observacoes ?? null,
        }),
      );
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.AUTO_INFRACAO_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
  private addDays(date: string, days: number): string {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    parsed.setUTCDate(parsed.getUTCDate() + days);
    return parsed.toISOString().slice(0, 10);
  }
}

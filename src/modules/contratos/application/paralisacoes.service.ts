import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ParalisacaoRepositoryException from '@/modules/contratos/exceptions/paralisacao_repository.exception';
export default class ParalisacoesService {
  constructor(
    private readonly paralisacaoRepo: IParalisacaoRepository,
    private readonly contratoRepo: IContratoRepository,
    private readonly tc: TenantContext,
  ) {}
  async create(
    contratoId: string,
    param: {
      dataParalisacao: string;
      motivo: string;
      termoParalisacaoArquivoId: string;
    },
  ): AsyncResult<AppException, ParalisacaoEntity> {
    try {
      const contrato = await this.contratoRepo.findById(contratoId);
      if (contrato.isLeft()) return left(contrato.value);
      if (!contrato.value)
        return left(
          new ParalisacaoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          } as any),
        );
      const ctx = this.tc.require();
      const entity = ParalisacaoEntity.create({
        tenantId: ctx.tenantId,
        contratoId,
        dataParalisacao: param.dataParalisacao,
        motivo: param.motivo,
        termoParalisacaoArquivoId: param.termoParalisacaoArquivoId,
      });
      return this.paralisacaoRepo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async list(contratoId: string) {
    return this.paralisacaoRepo.listByContrato(contratoId);
  }
  async reiniciar(
    id: string,
    dataReinicio: string,
    termoRetomadaArquivoId?: string,
  ): AsyncResult<AppException, ParalisacaoEntity> {
    try {
      const found = await this.paralisacaoRepo.findById(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ParalisacaoRepositoryException({
            code: ErrorCodeConstants.PARALISACAO_NOT_FOUND,
            statusCode: 404,
          } as any),
        );
      found.value.reiniciar(dataReinicio, termoRetomadaArquivoId ?? null);
      return this.paralisacaoRepo.save(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async delete(id: string): AsyncResult<AppException, true> {
    return this.paralisacaoRepo.delete(id);
  }
}

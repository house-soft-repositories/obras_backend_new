import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AditivoRepositoryException from '@/modules/contratos/exceptions/aditivo_repository.exception';
export default class AditivosService {
  constructor(
    private readonly aditivoRepo: IAditivoRepository,
    private readonly contratoRepo: IContratoRepository,
    private readonly tc: TenantContext,
  ) {}
  async create(
    contratoId: string,
    param: {
      numero: string;
      tipo: string;
      dataAssinatura?: string | null;
      tipoPrazoExecucao?: string | null;
      prazoExecucaoDias?: number | null;
      prazoExecucaoData?: string | null;
      vigenciaAditivada?: string | null;
      observacoes?: string | null;
    },
  ): AsyncResult<AppException, AditivoEntity> {
    try {
      const contrato = await this.contratoRepo.findById(contratoId);
      if (contrato.isLeft()) return left(contrato.value);
      if (!contrato.value)
        return left(
          new AditivoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          } as any),
        );
      const ctx = this.tc.require();
      const entity = AditivoEntity.create({
        tenantId: ctx.tenantId,
        contratoId,
        numero: param.numero,
        tipo: param.tipo as any,
        dataAssinatura: param.dataAssinatura ?? null,
        tipoPrazoExecucao: (param.tipoPrazoExecucao as any) ?? null,
        prazoExecucaoDias: param.prazoExecucaoDias ?? null,
        prazoExecucaoData: param.prazoExecucaoData ?? null,
        vigenciaAditivada: param.vigenciaAditivada ?? null,
        observacoes: param.observacoes ?? null,
      });
      return this.aditivoRepo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async list(contratoId: string): AsyncResult<AppException, AditivoEntity[]> {
    return this.aditivoRepo.listByContrato(contratoId);
  }
  async get(id: string): AsyncResult<AppException, AditivoEntity | null> {
    return this.aditivoRepo.findById(id);
  }
  async delete(id: string): AsyncResult<AppException, true> {
    return this.aditivoRepo.delete(id);
  }
}

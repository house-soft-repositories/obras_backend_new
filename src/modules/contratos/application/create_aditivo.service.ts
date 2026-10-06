import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import ICreateAditivoUseCase, {
  CreateAditivoParam,
} from '@/modules/contratos/domain/usecase/create_aditivo.usecase';
import AditivoRepositoryException from '@/modules/contratos/exceptions/aditivo_repository.exception';

export default class CreateAditivoService implements ICreateAditivoUseCase {
  constructor(
    private readonly aditivoRepo: IAditivoRepository,
    private readonly contratoRepo: IContratoRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(
    param: CreateAditivoParam,
  ): AsyncResult<AppException, AditivoEntity> {
    try {
      const contrato = await this.contratoRepo.findById(param.contratoId);
      if (contrato.isLeft()) return left(contrato.value);
      if (!contrato.value) {
        return left(
          new AditivoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }

      const ctx = this.tc.require();
      const entity = AditivoEntity.create({
        tenantId: ctx.tenantId,
        contratoId: param.contratoId,
        numero: param.numero,
        tipo: param.tipo,
        dataAssinatura: param.dataAssinatura ?? null,
        tipoPrazoExecucao: param.tipoPrazoExecucao ?? null,
        prazoExecucaoDias: param.prazoExecucaoDias ?? null,
        prazoExecucaoData: param.prazoExecucaoData ?? null,
        vigenciaAditivada: param.vigenciaAditivada ?? null,
        observacoes: param.observacoes ?? null,
        fontes: param.fontes ?? [],
      });

      return this.aditivoRepo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

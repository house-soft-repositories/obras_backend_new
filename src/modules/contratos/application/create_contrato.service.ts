import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import ICreateContratoUseCase, {
  CreateContratoParam,
} from '@/modules/contratos/domain/usecase/create_contrato.usecase';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoServiceException from '@/modules/contratos/exceptions/contrato_service.exception';

export default class CreateContratoService implements ICreateContratoUseCase {
  constructor(
    private readonly contratoRepo: IContratoRepository,
    private readonly empresaRepo: IEmpresaContratadaRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(
    param: CreateContratoParam,
  ): AsyncResult<AppException, ContratoEntity> {
    try {
      const ctx = this.tc.require();

      const obraExists = await this.contratoRepo.existsObraAtiva(param.obraId);
      if (obraExists.isLeft()) return left(obraExists.value);
      if (!obraExists.value) {
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }

      const emp = await this.empresaRepo.findById(param.empresaContratadaId);
      if (emp.isLeft()) return left(emp.value);
      if (!emp.value) {
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.EMPRESA_CONTRATADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }

      if (param.fontes?.length) {
        for (const f of param.fontes) {
          const fonte = await this.contratoRepo.existsFonte(f.fonteId);
          if (fonte.isLeft()) return left(fonte.value);
          if (!fonte.value) {
            return left(
              new ContratoRepositoryException({
                code: ErrorCodeConstants.FONTE_NOT_FOUND,
                statusCode: 422,
              }),
            );
          }
        }
      }

      const exists = await this.contratoRepo.findByObraSingle(param.obraId);
      if (exists.isLeft()) return left(exists.value);
      if (exists.value) {
        return left(
          new ContratoServiceException({
            code: ErrorCodeConstants.CONTRATO_DUPLICATE_NUMERO,
            statusCode: 409,
          }),
        );
      }

      const entity = ContratoEntity.create({
        tenantId: ctx.tenantId,
        obraId: param.obraId,
        empresaContratadaId: param.empresaContratadaId,
        numero: param.numero,
        dataOs: param.dataOs,
        tipoPrazoExecucao: param.tipoPrazoExecucao,
        prazoExecucaoDias: param.prazoExecucaoDias ?? null,
        prazoExecucaoData: param.prazoExecucaoData ?? null,
        objeto: param.objeto ?? null,
        dataAssinatura: param.dataAssinatura ?? null,
        fimVigencia: param.fimVigencia ?? null,
        fontes: param.fontes,
      });

      return this.contratoRepo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      if ((cause as { code?: string })?.code === '23505') {
        return left(
          new ContratoServiceException({
            code: ErrorCodeConstants.CONTRATO_DUPLICATE_NUMERO,
            statusCode: 409,
            cause,
          }),
        );
      }
      return left(
        new ContratoServiceException({
          code: ErrorCodeConstants.CONTRATO_CREATE_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

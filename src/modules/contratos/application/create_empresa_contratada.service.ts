import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import ICreateEmpresaContratadaUseCase, {
  CreateEmpresaContratadaParam,
} from '@/modules/contratos/domain/usecase/create_empresa_contratada.usecase';
import EmpresaRepositoryException from '@/modules/contratos/exceptions/empresa_repository.exception';

export default class CreateEmpresaContratadaService
  implements ICreateEmpresaContratadaUseCase
{
  constructor(
    private readonly repo: IEmpresaContratadaRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(
    param: CreateEmpresaContratadaParam,
  ): AsyncResult<AppException, EmpresaContratadaEntity> {
    try {
      const ctx = this.tc.require();
      const exists = await this.repo.existsCnpj(
        param.cnpj.replace(/\D/g, ''),
      );
      if (exists.isLeft()) return left(exists.value);
      if (exists.value) {
        return left(
          new EmpresaRepositoryException({
            code: ErrorCodeConstants.EMPRESA_DUPLICATE_CNPJ,
            statusCode: 409,
          }),
        );
      }

      const entity = EmpresaContratadaEntity.create({
        tenantId: ctx.tenantId,
        razaoSocial: param.razaoSocial,
        cnpj: param.cnpj,
        nomeFantasia: param.nomeFantasia ?? null,
        responsavel: param.responsavel ?? null,
        email: param.email ?? null,
        cargoResponsavel: param.cargoResponsavel ?? null,
        cep: param.cep ?? null,
        logradouro: param.logradouro ?? null,
        numero: param.numero ?? null,
        complemento: param.complemento ?? null,
        bairro: param.bairro ?? null,
        cidade: param.cidade ?? null,
        uf: param.uf ?? null,
        telefones: param.telefones ?? [],
      });

      return this.repo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

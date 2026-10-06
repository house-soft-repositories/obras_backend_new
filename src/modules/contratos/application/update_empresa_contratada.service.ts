import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import IUpdateEmpresaContratadaUseCase, {
  UpdateEmpresaContratadaParam,
} from '@/modules/contratos/domain/usecase/update_empresa_contratada.usecase';
import EmpresaRepositoryException from '@/modules/contratos/exceptions/empresa_repository.exception';
import GetEmpresaContratadaService from '@/modules/contratos/application/get_empresa_contratada.service';

export default class UpdateEmpresaContratadaService
  implements IUpdateEmpresaContratadaUseCase
{
  private readonly getter: GetEmpresaContratadaService;

  constructor(private readonly repo: IEmpresaContratadaRepository) {
    this.getter = new GetEmpresaContratadaService(repo);
  }

  async execute(
    param: UpdateEmpresaContratadaParam,
  ): AsyncResult<AppException, EmpresaContratadaEntity> {
    try {
      const found = await this.getter.execute({ id: param.id });
      if (found.isLeft()) return left(found.value);
      const previous = found.value.toObject();

      const candidate = EmpresaContratadaEntity.create({
        ...previous,
        ...param.patch,
        tenantId: previous.tenantId,
        razaoSocial: param.patch.razaoSocial ?? previous.razaoSocial,
        cnpj: param.patch.cnpj ?? previous.cnpj,
        telefones: param.patch.telefones ?? previous.telefones,
      }).toObject();

      const duplicate = await this.repo.existsCnpj(candidate.cnpj, param.id);
      if (duplicate.isLeft()) return left(duplicate.value);
      if (duplicate.value) {
        return left(
          new EmpresaRepositoryException({
            code: ErrorCodeConstants.EMPRESA_DUPLICATE_CNPJ,
            statusCode: 409,
          }),
        );
      }

      return this.repo.save(
        EmpresaContratadaEntity.fromData({
          ...candidate,
          id: previous.id,
          createdAt: previous.createdAt,
          updatedAt: new Date(),
        }),
      );
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

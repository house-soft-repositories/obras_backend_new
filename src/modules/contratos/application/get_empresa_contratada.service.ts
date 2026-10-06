import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import IGetEmpresaContratadaUseCase, {
  GetEmpresaContratadaParam,
} from '@/modules/contratos/domain/usecase/get_empresa_contratada.usecase';
import EmpresaRepositoryException from '@/modules/contratos/exceptions/empresa_repository.exception';

export default class GetEmpresaContratadaService
  implements IGetEmpresaContratadaUseCase
{
  constructor(private readonly repo: IEmpresaContratadaRepository) {}

  async execute(
    param: GetEmpresaContratadaParam,
  ): AsyncResult<AppException, EmpresaContratadaEntity> {
    const found = await this.repo.findById(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_CONTRATADA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(found.value);
  }
}

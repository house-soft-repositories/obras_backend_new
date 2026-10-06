import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import AsyncResult from '@/core/types/async_result';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import IListEmpresasContratadasUseCase, {
  ListEmpresasContratadasParam,
} from '@/modules/contratos/domain/usecase/list_empresas_contratadas.usecase';

export default class ListEmpresasContratadasService
  implements IListEmpresasContratadasUseCase
{
  constructor(private readonly repo: IEmpresaContratadaRepository) {}

  async execute(
    param: ListEmpresasContratadasParam,
  ): AsyncResult<AppException, PageEntity<EmpresaContratadaEntity>> {
    return this.repo.findPage(param.pageOptions);
  }
}

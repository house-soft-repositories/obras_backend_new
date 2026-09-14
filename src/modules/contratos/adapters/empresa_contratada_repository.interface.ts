import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
export default interface IEmpresaContratadaRepository {
  save(
    e: EmpresaContratadaEntity,
  ): AsyncResult<AppException, EmpresaContratadaEntity>;
  findById(
    id: string,
  ): AsyncResult<AppException, EmpresaContratadaEntity | null>;
  findPage(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EmpresaContratadaEntity>>;
  existsCnpj(cnpj: string, excludeId?: string): AsyncResult<AppException, boolean>;
  delete(id: string): AsyncResult<AppException, void>;
}

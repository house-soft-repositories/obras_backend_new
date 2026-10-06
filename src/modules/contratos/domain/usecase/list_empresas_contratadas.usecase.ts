import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type UseCase from '@/core/types/use_case';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';

export interface ListEmpresasContratadasParam {
  pageOptions: PageOptionsEntity;
}

type IListEmpresasContratadasUseCase = UseCase<
  ListEmpresasContratadasParam,
  PageEntity<EmpresaContratadaEntity>
>;

export default IListEmpresasContratadasUseCase;

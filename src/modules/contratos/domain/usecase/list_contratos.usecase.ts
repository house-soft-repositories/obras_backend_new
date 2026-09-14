import type UseCase from '@/core/types/use_case';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
export interface ListContratosParam {
  obraId: string;
  pageOptions: PageOptionsEntity;
}
type IListContratosUseCase = UseCase<
  ListContratosParam,
  PageEntity<ContratoEntity>
>;
export default IListContratosUseCase;

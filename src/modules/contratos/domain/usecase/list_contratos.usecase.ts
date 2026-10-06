import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type UseCase from '@/core/types/use_case';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';

export interface ListContratosParam {
  pageOptions: PageOptionsEntity;
}

type IListContratosUseCase = UseCase<
  ListContratosParam,
  PageEntity<ContratoEntity>
>;

export default IListContratosUseCase;

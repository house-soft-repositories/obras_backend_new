import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
export interface ListFontesParam { page?:number; take?:number; order?:'ASC'|'DESC'; }
type IListFontesUseCase = UseCase<ListFontesParam, PageEntity<FonteEntity>>;
export default IListFontesUseCase;

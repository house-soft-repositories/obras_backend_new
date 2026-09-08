import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
export interface ListPessoasParam { page?:number; take?:number; order?:'ASC'|'DESC'; }
type IListPessoasUseCase = UseCase<ListPessoasParam, PageEntity<PessoaEntity>>;
export default IListPessoasUseCase;

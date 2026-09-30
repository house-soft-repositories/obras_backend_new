import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
export interface BuscarPessoasParam { q: string; tipo?: string; page?: number; take?: number; order?: 'ASC' | 'DESC'; limit?: number; }
type IBuscarPessoasUseCase = UseCase<BuscarPessoasParam, PageEntity<PessoaEntity>>;
export default IBuscarPessoasUseCase;

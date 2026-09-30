import type UseCase from '@/core/types/use_case';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
export interface GetPessoaParam { id: string; }
type IGetPessoaUseCase = UseCase<GetPessoaParam, PessoaEntity>;
export default IGetPessoaUseCase;

import type UseCase from '@/core/types/use_case';
import PessoaEntity, { UpdatePessoaProps } from '@/modules/pessoas/domain/entities/pessoa.entity';
export interface UpdatePessoaParam { id: string; data: UpdatePessoaProps; }
type IUpdatePessoaUseCase = UseCase<UpdatePessoaParam, PessoaEntity>;
export default IUpdatePessoaUseCase;

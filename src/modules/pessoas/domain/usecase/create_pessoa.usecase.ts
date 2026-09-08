import type UseCase from '@/core/types/use_case';
import PessoaEntity, { CreatePessoaProps } from '@/modules/pessoas/domain/entities/pessoa.entity';
export type CreatePessoaParam = CreatePessoaProps;
type ICreatePessoaUseCase = UseCase<CreatePessoaParam,PessoaEntity>;
export default ICreatePessoaUseCase;

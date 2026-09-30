import type UseCase from '@/core/types/use_case';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

type IListProfissionaisTecnicosUseCase = UseCase<
  void,
  ProfissionalTecnicoComPessoaProps[]
>;
export default IListProfissionaisTecnicosUseCase;

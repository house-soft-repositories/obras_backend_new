import type UseCase from '@/core/types/use_case';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

export interface GetProfissionalTecnicoParam {
  id: string;
}

type IGetProfissionalTecnicoUseCase = UseCase<
  GetProfissionalTecnicoParam,
  ProfissionalTecnicoComPessoaProps
>;
export default IGetProfissionalTecnicoUseCase;

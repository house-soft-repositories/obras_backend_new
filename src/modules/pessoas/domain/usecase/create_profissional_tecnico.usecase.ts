import type UseCase from '@/core/types/use_case';
import {
  ConselhoProfissional,
  ProfissionalTecnicoComPessoaProps,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

export interface CreateProfissionalTecnicoParam {
  pessoaId: string;
  conselho: ConselhoProfissional;
  numeroRegistro: string;
  ufRegistro?: string | null;
  titulo?: string | null;
  ativo?: boolean;
}

type ICreateProfissionalTecnicoUseCase = UseCase<
  CreateProfissionalTecnicoParam,
  ProfissionalTecnicoComPessoaProps
>;
export default ICreateProfissionalTecnicoUseCase;

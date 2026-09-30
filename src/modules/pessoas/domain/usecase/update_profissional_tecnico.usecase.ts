import type UseCase from '@/core/types/use_case';
import {
  ConselhoProfissional,
  ProfissionalTecnicoComPessoaProps,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

export interface UpdateProfissionalTecnicoParam {
  id: string;
  data: {
    conselho?: ConselhoProfissional;
    numeroRegistro?: string;
    ufRegistro?: string | null;
    titulo?: string | null;
    ativo?: boolean;
  };
}

type IUpdateProfissionalTecnicoUseCase = UseCase<
  UpdateProfissionalTecnicoParam,
  ProfissionalTecnicoComPessoaProps
>;
export default IUpdateProfissionalTecnicoUseCase;

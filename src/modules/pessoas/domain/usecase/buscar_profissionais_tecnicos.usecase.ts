import PageEntity from '@/core/pagination/domain/entities/page.entity';
import type UseCase from '@/core/types/use_case';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

export interface BuscarProfissionaisTecnicosParam {
  q: string;
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
}

type IBuscarProfissionaisTecnicosUseCase = UseCase<
  BuscarProfissionaisTecnicosParam,
  PageEntity<ProfissionalTecnicoComPessoaProps>
>;
export default IBuscarProfissionaisTecnicosUseCase;

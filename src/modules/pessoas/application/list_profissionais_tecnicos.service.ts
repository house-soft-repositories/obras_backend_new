import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import IListProfissionaisTecnicosUseCase from '@/modules/pessoas/domain/usecase/list_profissionais_tecnicos.usecase';

export default class ListProfissionaisTecnicosService
  implements IListProfissionaisTecnicosUseCase
{
  constructor(private readonly repository: IProfissionalTecnicoRepository) {}

  async execute(): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps[]> {
    return this.repository.findAllViews();
  }
}

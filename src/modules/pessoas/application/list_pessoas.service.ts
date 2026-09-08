import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import IListPessoasUseCase, { ListPessoasParam } from '@/modules/pessoas/domain/usecase/list_pessoas.usecase';
export default class ListPessoasService implements IListPessoasUseCase {
  constructor(private readonly repo:IPessoaRepository){}
  async execute(p:ListPessoasParam):AsyncResult<AppException,PageEntity<PessoaEntity>>{ return this.repo.findAll(new PageOptionsEntity(p.order,p.page,p.take)); }
}

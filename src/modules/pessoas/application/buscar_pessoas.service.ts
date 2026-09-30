import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import IBuscarPessoasUseCase, { BuscarPessoasParam } from '@/modules/pessoas/domain/usecase/buscar_pessoas.usecase';
import PessoaServiceException from '@/modules/pessoas/exceptions/pessoa_service.exception';
export default class BuscarPessoasService implements IBuscarPessoasUseCase {
  constructor(private readonly repo:IPessoaRepository){}
  async execute(p:BuscarPessoasParam):AsyncResult<AppException,PageEntity<PessoaEntity>>{
    try{
      const q = p.q?.trim() ?? '';
      if(q.length < 3) return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_INVALID_BUSCA,statusCode:400}));
      const take = p.take ?? p.limit ?? 10;
      return this.repo.findAll(new PageOptionsEntity(p.order ?? 'ASC', p.page ?? 1, Math.min(take, 25)), { busca: q, tipo: p.tipo, ativoOnly: true });
    }catch(e){ if(e instanceof AppException) return left(e); return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,statusCode:500,cause:e})); }
  }
}

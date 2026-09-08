import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
export default interface IPessoaRepository {
  save(e:PessoaEntity):AsyncResult<AppException,PessoaEntity>;
  findByDocumento(documento:string):AsyncResult<AppException,PessoaEntity|null>;
  findById(id:string):AsyncResult<AppException,PessoaEntity|null>;
  findAll(opts:PageOptionsEntity):AsyncResult<AppException,PageEntity<PessoaEntity>>;
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import ICreatePessoaUseCase, { CreatePessoaParam } from '@/modules/pessoas/domain/usecase/create_pessoa.usecase';
import PessoaDomainException from '@/modules/pessoas/exceptions/pessoa_domain.exception';
import PessoaServiceException from '@/modules/pessoas/exceptions/pessoa_service.exception';
export default class CreatePessoaService implements ICreatePessoaUseCase {
  constructor(private readonly repo:IPessoaRepository){}
  async execute(p:CreatePessoaParam):AsyncResult<AppException,PessoaEntity>{
    try{
      const digits=p.documento.replace(/\D/g,'');
      const ex=await this.repo.findByDocumento(digits);
      if(ex.isRight()&&ex.value) return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_DUPLICATE_DOCUMENTO,statusCode:409}));
      if(ex.isLeft()) return left(ex.value);
      return this.repo.save(PessoaEntity.create(p));
    }catch(e){ if(e instanceof PessoaDomainException) return left(e); if(e instanceof AppException) return left(e); return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_CREATE_FAILED,statusCode:500,cause:e})); }
  }
}

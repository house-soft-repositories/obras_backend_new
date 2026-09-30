import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import IGetPessoaUseCase, { GetPessoaParam } from '@/modules/pessoas/domain/usecase/get_pessoa.usecase';
import PessoaServiceException from '@/modules/pessoas/exceptions/pessoa_service.exception';
export default class GetPessoaService implements IGetPessoaUseCase {
  constructor(private readonly repo:IPessoaRepository){}
  async execute(p:GetPessoaParam):AsyncResult<AppException,PessoaEntity>{
    try{
      const found = await this.repo.findById(p.id);
      if(found.isLeft()) return left(found.value);
      if(!found.value) return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_NOT_FOUND,statusCode:404}));
      return right(found.value);
    }catch(e){ if(e instanceof AppException) return left(e); return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,statusCode:500,cause:e})); }
  }
}

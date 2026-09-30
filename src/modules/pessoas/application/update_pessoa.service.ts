import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import IUpdatePessoaUseCase, { UpdatePessoaParam } from '@/modules/pessoas/domain/usecase/update_pessoa.usecase';
import PessoaDomainException from '@/modules/pessoas/exceptions/pessoa_domain.exception';
import PessoaServiceException from '@/modules/pessoas/exceptions/pessoa_service.exception';
export default class UpdatePessoaService implements IUpdatePessoaUseCase {
  constructor(private readonly repo:IPessoaRepository){}
  async execute(p:UpdatePessoaParam):AsyncResult<AppException,PessoaEntity>{
    try{
      const found = await this.repo.findById(p.id);
      if(found.isLeft()) return left(found.value);
      if(!found.value) return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_NOT_FOUND,statusCode:404}));
      const current = found.value.toObject();
      const nextTipo = p.data.tipo ?? current.tipo;
      const nextDocumento = p.data.documento !== undefined ? p.data.documento.replace(/\D/g,'') : current.documento;
      if(nextDocumento !== current.documento || nextTipo !== current.tipo){
        const digits = nextDocumento.replace(/\D/g,'');
        const existing = await this.repo.findByDocumento(digits);
        if(existing.isLeft()) return left(existing.value);
        if(existing.value && existing.value.id !== p.id) return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_DUPLICATE_DOCUMENTO,statusCode:409}));
        return this.repo.save(found.value.update({...p.data, tipo: nextTipo, documento: digits}));
      }
      return this.repo.save(found.value.update(p.data));
    }catch(e){ if(e instanceof PessoaDomainException) return left(e); if(e instanceof AppException) return left(e); return left(new PessoaServiceException({code:ErrorCodeConstants.PESSOA_UPDATE_FAILED,statusCode:500,cause:e})); }
  }
}

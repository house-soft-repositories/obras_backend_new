import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import TenantContext from '@/core/multitenancy/tenant_context';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import ICreateObraPrivadaUseCase, { CreateObraPrivadaParam } from '@/modules/obras-privadas/domain/usecase/create_obra_privada.usecase';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { proximoCodigo } from '@/modules/obras-privadas/services/codigo_privado.service';
export default class CreateObraPrivadaService implements ICreateObraPrivadaUseCase {
  constructor(private readonly repo:IObraPrivadaRepository, private readonly pessoaRepo:IPessoaRepository, private readonly tc:TenantContext){}
  async execute(p:CreateObraPrivadaParam):AsyncResult<AppException,ObraPrivadaEntity>{
    try{
      const pessoa=await this.pessoaRepo.findById(p.proprietarioPessoaId);
      if(pessoa.isLeft()) return left(pessoa.value);
      if(!pessoa.value) return left(new ObraPrivadaServiceException({code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO,statusCode:422}));
      const year=new Date().getFullYear();
      for(let i=0;i<3;i++){
        const last=await this.repo.findLastCodigo(year);
        if(last.isLeft()) return left(last.value);
        const codigo=proximoCodigo('OBP', last.value, year);
        const entity=ObraPrivadaEntity.create({...p,codigo});
        const saved=await this.repo.save(entity);
        if(saved.isRight()) return right(saved.value);
        if(saved.isLeft() && saved.value.code===ErrorCodeConstants.OBRA_PRIVADA_DUPLICATE_CODIGO) continue;
        return left(saved.value);
      }
      return left(new ObraPrivadaServiceException({code:ErrorCodeConstants.OBRA_PRIVADA_DUPLICATE_CODIGO,statusCode:409}));
    }catch(e){ if(e instanceof ObraPrivadaDomainException) return left(e); if(e instanceof AppException) return left(e); return left(new ObraPrivadaServiceException({code:ErrorCodeConstants.OBRA_PRIVADA_CREATE_FAILED,statusCode:500,cause:e})); }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import ICreateFonteUseCase, { CreateFonteParam } from '@/modules/fontes/domain/usecase/create_fonte.usecase';
import FonteDomainException from '@/modules/fontes/exceptions/fonte_domain.exception';
import FonteServiceException from '@/modules/fontes/exceptions/fonte_service.exception';
export default class CreateFonteService implements ICreateFonteUseCase {
  constructor(private readonly repo: IFonteRepository){}
  async execute(param: CreateFonteParam): AsyncResult<AppException, FonteEntity>{
    try{
      if (param.codigo) {
        const existing = await this.repo.findByCodigo(param.codigo);
        if (existing.isLeft()) return left(existing.value);
        if (existing.value) return left(new FonteServiceException({ code: ErrorCodeConstants.FONTE_DUPLICATE_CODE, statusCode: 409 }));
      }
      const entity=FonteEntity.create(param);
      return this.repo.save(entity);
    } catch(e){
      if(e instanceof FonteDomainException) return left(e);
      if(e instanceof AppException) return left(e);
      return left(new FonteServiceException({code:ErrorCodeConstants.FONTE_CREATE_FAILED,statusCode:500,cause:e}));
    }
  }
}

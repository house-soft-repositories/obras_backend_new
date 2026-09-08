import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import IListFontesUseCase, { ListFontesParam } from '@/modules/fontes/domain/usecase/list_fontes.usecase';
export default class ListFontesService implements IListFontesUseCase {
  constructor(private readonly repo: IFonteRepository){}
  async execute(param: ListFontesParam): AsyncResult<AppException, PageEntity<FonteEntity>>{
    const opts=new PageOptionsEntity(param.order, param.page, param.take);
    return this.repo.findAll(opts);
  }
}

import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { IClassificacaoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { ClassificacaoEntity } from '@/modules/obras/domain/entities/cadastro.entity';

export default class ListClassificacaosService {
  constructor(private readonly repository: IClassificacaoRepository) {}
  execute(param: { page: number; take: number; apenasAtivos?: boolean; parentId?: string }): AsyncResult<AppException, PageEntity<ClassificacaoEntity>> {
    return this.repository.findPage(new PageOptionsEntity('ASC', param.page, param.take), param.apenasAtivos, param.parentId);
  }
}

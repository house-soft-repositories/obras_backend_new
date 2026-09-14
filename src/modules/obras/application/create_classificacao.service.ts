import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { IClassificacaoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { ClassificacaoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import TenantContext from '@/core/multitenancy/tenant_context';

export default class CreateClassificacaoService {
  constructor(private readonly repository: IClassificacaoRepository, private readonly tenantContext: TenantContext) {}
  execute(param: { nome: string }): AsyncResult<AppException, ClassificacaoEntity> {
    const entity = ClassificacaoEntity.create({ tenantId: this.tenantContext.require().tenantId, nome: param.nome });
    return this.repository.save(entity);
  }
}

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { ISubclassificacaoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { SubclassificacaoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import TenantContext from '@/core/multitenancy/tenant_context';

export default class CreateSubclassificacaoService {
  constructor(private readonly repository: ISubclassificacaoRepository, private readonly tenantContext: TenantContext) {}
  execute(param: { nome: string; parentId: string }): AsyncResult<AppException, SubclassificacaoEntity> {
    const entity = SubclassificacaoEntity.create({ tenantId: this.tenantContext.require().tenantId, classificacaoId: param.parentId, nome: param.nome });
    return this.repository.save(entity);
  }
}

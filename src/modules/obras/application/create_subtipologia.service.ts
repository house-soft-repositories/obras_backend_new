import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { ISubtipologiaRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { SubtipologiaEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import TenantContext from '@/core/multitenancy/tenant_context';

export default class CreateSubtipologiaService {
  constructor(private readonly repository: ISubtipologiaRepository, private readonly tenantContext: TenantContext) {}
  execute(param: { nome: string; parentId: string }): AsyncResult<AppException, SubtipologiaEntity> {
    const entity = SubtipologiaEntity.create({ tenantId: this.tenantContext.require().tenantId, tipologiaId: param.parentId, nome: param.nome });
    return this.repository.save(entity);
  }
}

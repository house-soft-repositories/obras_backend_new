import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { ITipologiaRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { TipologiaEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import TenantContext from '@/core/multitenancy/tenant_context';

export default class CreateTipologiaService {
  constructor(private readonly repository: ITipologiaRepository, private readonly tenantContext: TenantContext) {}
  execute(param: { nome: string }): AsyncResult<AppException, TipologiaEntity> {
    const entity = TipologiaEntity.create({ tenantId: this.tenantContext.require().tenantId, nome: param.nome });
    return this.repository.save(entity);
  }
}

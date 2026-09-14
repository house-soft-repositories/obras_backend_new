import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { IEixoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { EixoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import TenantContext from '@/core/multitenancy/tenant_context';

export default class CreateEixoService {
  constructor(private readonly repository: IEixoRepository, private readonly tenantContext: TenantContext) {}
  execute(param: { nome: string }): AsyncResult<AppException, EixoEntity> {
    const entity = EixoEntity.create({ tenantId: this.tenantContext.require().tenantId, nome: param.nome });
    return this.repository.save(entity);
  }
}

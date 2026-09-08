import TenantContext from '@/core/multitenancy/tenant_context';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import ITenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver.interface';
import { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class TenantRequestContextService {
  constructor(
    private readonly resolver: ITenantSchemaResolver,
    private readonly context: TenantContext,
  ) {}

  async run<T>(
    user: AccessTokenPayload | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!user || !user.tenantId) {
      throw new TenantContextException();
    }
    const tenant = await this.resolver.resolve(user.tenantId);
    if (!tenant) throw new TenantContextException();
    return this.context.run(tenant, callback);
  }
}

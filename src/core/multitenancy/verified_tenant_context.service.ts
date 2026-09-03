import ITokenService from '@/modules/auth/adapters/token_service.interface';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import ITenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver.interface';

export default class VerifiedTenantContextService {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly tenantSchemaResolver: ITenantSchemaResolver,
    private readonly tenantContext: TenantContext,
  ) {}

  async run<T>(accessToken: string, callback: () => Promise<T>): Promise<T> {
    try {
      const payload = await this.tokenService.verifyAccess(accessToken);
      if (payload.role === UserRole.SUPERADMIN) return callback();
      if (!payload.tenantId) throw new TenantContextException();

      const context = await this.tenantSchemaResolver.resolve(payload.tenantId);
      if (!context) throw new TenantContextException();
      return await this.tenantContext.run(context, callback);
    } catch (error) {
      if (error instanceof TenantContextException) throw error;
      throw new TenantContextException({ cause: error });
    }
  }
}

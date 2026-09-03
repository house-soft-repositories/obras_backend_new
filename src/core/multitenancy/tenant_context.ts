import { AsyncLocalStorage } from 'node:async_hooks';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';

export interface TenantContextValue {
  tenantId: string;
  schemaName: string;
}

export default class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantContextValue>();

  run<T>(context: TenantContextValue, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): TenantContextValue | undefined {
    return this.storage.getStore();
  }

  require(): TenantContextValue {
    const context = this.get();
    if (!context) throw new TenantContextException();
    return context;
  }
}

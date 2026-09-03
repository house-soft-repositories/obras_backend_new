import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import TenancyDomainException from '@/modules/tenancy/exceptions/tenancy_domain.exception';
import { validTenancy } from '@test/constants/tenancy/domain/entities/tenancy.constants';

describe('TenancyEntity', () => {
  it('creates an active tenancy with an internally generated schema name', () => {
    const tenancy = TenancyEntity.create(validTenancy);

    expect(tenancy.active).toBe(true);
    expect(tenancy.schemaName).toMatch(/^tenant_[0-9a-f]{32}$/);
    expect(tenancy.slug).toBe('prefeitura-exemplo');
  });

  it.each([
    [{ ...validTenancy, name: ' ' }, ErrorCodeConstants.TENANCY_INVALID_NAME],
    [{ ...validTenancy, slug: 'Slug inválido' }, ErrorCodeConstants.TENANCY_INVALID_SLUG],
    [{ ...validTenancy, cnpj: '123' }, ErrorCodeConstants.TENANCY_INVALID_CNPJ],
  ])('rejects invalid tenancy data with %s', (params, expectedCode) => {
    expect.assertions(2);
    try {
      TenancyEntity.create(params);
    } catch (error) {
      if (!(error instanceof TenancyDomainException)) {
        throw error;
      }

      expect(error).toBeInstanceOf(TenancyDomainException);
      expect(error.code).toBe(expectedCode);
    }
  });

  it('reconstitutes persisted data without applying creation validation', () => {
    const createdAt = new Date('2026-09-02T00:00:00.000Z');
    const tenancy = TenancyEntity.fromData({
      ...validTenancy,
      id: 'invalid-persisted-id',
      active: false,
      schemaName: 'legacy_schema',
      createdAt,
      updatedAt: createdAt,
    });

    expect(tenancy.schemaName).toBe('legacy_schema');
    expect(tenancy.active).toBe(false);
  });
});

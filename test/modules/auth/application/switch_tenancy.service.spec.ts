import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import mockPasswordHasher from '@test/mocks/auth/adapters/password_hasher.mock';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import SwitchTenancyService from '@/modules/auth/application/switch_tenancy.service';
import IListTenanciesUseCase from '@/modules/tenancy/domain/usecase/list_tenancies.usecase';
import TenancyServiceException from '@/modules/tenancy/exceptions/tenancy_service.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import mockUserSessionRepository from '@test/mocks/auth/adapters/user_session_repository.mock';
import mockTokenService from '@test/mocks/auth/adapters/token_service.mock';

describe('SwitchTenancyService', () => {
  const tenantId = '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc';
  const superadmin = {
    sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
    type: 'access' as const,
    role: UserRole.SUPERADMIN,
    tenantId: null,
  };
  const tenancy = {
    id: tenantId,
    name: 'Tenant One',
    slug: 'tenant-one',
    cnpj: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockListTenancies = (): jest.Mocked<IListTenanciesUseCase> => ({
    execute: jest.fn(),
  });

  it('issues a tenant-scoped access token for an active tenancy selected by a superadmin', async () => {
    const listTenancies = mockListTenancies();
    const tokens = mockTokenService();
    const passwords = mockPasswordHasher();
    const sessions = mockUserSessionRepository();
    listTenancies.execute.mockResolvedValue(right([tenancy]));
    tokens.signAccess.mockResolvedValue('tenant-access-token');
    tokens.signRefresh.mockResolvedValue('tenant-refresh-token');
    passwords.hash.mockResolvedValue('tenant-refresh-token-hash');
    sessions.save.mockResolvedValue(
      right(
        {
          id: 'session-id',
          userId: superadmin.sub,
          refreshTokenHash: 'tenant-refresh-token-hash',
          expiresAt: new Date(),
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ),
    );
    const service = new SwitchTenancyService(
      listTenancies,
      tokens,
      passwords,
      sessions,
    );

    const result = await service.execute({ user: superadmin, tenantId });

    expect(result.getOrThrow()).toEqual({
      accessToken: 'tenant-access-token',
      refreshToken: 'tenant-refresh-token',
      tenancy,
    });
    expect(tokens.signAccess.mock.calls).toContainEqual([
      {
        sub: superadmin.sub,
        role: UserRole.SUPERADMIN,
        tenantId,
      },
    ]);
    expect(tokens.signRefresh.mock.calls).toContainEqual([
      {
        sub: superadmin.sub,
        sid: expect.any(String),
        tenantId,
      },
    ]);
  });

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'rejects %s before reading tenancies or issuing a token',
    async (role) => {
    const listTenancies = mockListTenancies();
    const tokens = mockTokenService();
    const service = new SwitchTenancyService(
      listTenancies,
      tokens,
      mockPasswordHasher(),
      mockUserSessionRepository(),
    );

      const result = await service.execute({
        user: { ...superadmin, role, tenantId },
        tenantId,
      });

      expect(result.isLeft()).toBe(true);
      expect(listTenancies.execute.mock.calls).toHaveLength(0);
      expect(tokens.signAccess.mock.calls).toHaveLength(0);
      if (result.isRight()) throw new Error('Expected authorization failure');
      expect(result.value.code).toBe(
        ErrorCodeConstants.AUTH_TENANCY_SWITCH_FORBIDDEN,
      );
      expect(result.value.statusCode).toBe(403);
    },
  );

  it('rejects an inactive tenancy without issuing a token', async () => {
    const listTenancies = mockListTenancies();
    const tokens: jest.Mocked<ITokenService> = mockTokenService();
    listTenancies.execute.mockResolvedValue(
      right([{ ...tenancy, active: false }]),
    );
    const service = new SwitchTenancyService(
      listTenancies,
      tokens,
      mockPasswordHasher(),
      mockUserSessionRepository(),
    );

    const result = await service.execute({ user: superadmin, tenantId });

    expect(result.isLeft()).toBe(true);
    expect(tokens.signAccess.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected unavailable tenancy');
    expect(result.value.code).toBe(
      ErrorCodeConstants.AUTH_TENANCY_SWITCH_UNAVAILABLE,
    );
  });

  it('rejects a tenancy that is not available without issuing a token', async () => {
    const listTenancies = mockListTenancies();
    const tokens = mockTokenService();
    listTenancies.execute.mockResolvedValue(right([tenancy]));
    const service = new SwitchTenancyService(
      listTenancies,
      tokens,
      mockPasswordHasher(),
      mockUserSessionRepository(),
    );

    const result = await service.execute({
      user: superadmin,
      tenantId: 'c789522f-4ed1-4adc-8d3e-1526a44c912d',
    });

    expect(result.isLeft()).toBe(true);
    expect(tokens.signAccess.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected unavailable tenancy');
    expect(result.value.code).toBe(
      ErrorCodeConstants.AUTH_TENANCY_SWITCH_UNAVAILABLE,
    );
    expect(result.value.statusCode).toBe(404);
  });

  it('propagates a tenancy-list failure without issuing a token', async () => {
    const listTenancies = mockListTenancies();
    const tokens = mockTokenService();
    const failure = new TenancyServiceException({
      code: ErrorCodeConstants.TENANCY_PROVISION_FAILED,
      statusCode: 500,
    });
    listTenancies.execute.mockResolvedValue(left(failure));
    const service = new SwitchTenancyService(
      listTenancies,
      tokens,
      mockPasswordHasher(),
      mockUserSessionRepository(),
    );

    const result = await service.execute({ user: superadmin, tenantId });

    expect(result.isLeft()).toBe(true);
    expect(tokens.signAccess.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected tenancy-list failure');
    expect(result.value).toBe(failure);
  });
});

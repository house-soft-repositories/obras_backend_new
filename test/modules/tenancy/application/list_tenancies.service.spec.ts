import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import ListTenanciesService from '@/modules/tenancy/application/list_tenancies.service';
import TenancyServiceException from '@/modules/tenancy/exceptions/tenancy_service.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import mockTenancyRepository from '@test/mocks/tenancy/adapters/tenancy_repository.mock';

describe('ListTenanciesService', () => {
  const tenancies = [
    {
      id: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
      name: 'Tenant One',
      slug: 'tenant-one',
      cnpj: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('returns every tenancy for a superadmin', async () => {
    const repository = mockTenancyRepository();
    repository.findAll.mockResolvedValue(right(tenancies));
    const service = new ListTenanciesService(repository);

    const result = await service.execute({ role: UserRole.SUPERADMIN });

    expect(result.getOrThrow()).toEqual(tenancies);
    expect(repository.findAll.mock.calls).toHaveLength(1);
  });

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'rejects %s before reading tenancies',
    async (role) => {
      const repository = mockTenancyRepository();
      const service = new ListTenanciesService(repository);

      const result = await service.execute({ role });

      expect(result.isLeft()).toBe(true);
      expect(repository.findAll.mock.calls).toHaveLength(0);
      if (result.isRight()) throw new Error('Expected authorization failure');
      expect(result.value.code).toBe(ErrorCodeConstants.TENANCY_LIST_FORBIDDEN);
      expect(result.value.statusCode).toBe(403);
    },
  );

  it('propagates a repository failure without changing it', async () => {
    const repository = mockTenancyRepository();
    const failure = new TenancyServiceException({
      code: ErrorCodeConstants.TENANCY_PROVISION_FAILED,
      statusCode: 500,
    });
    repository.findAll.mockResolvedValue(left(failure));
    const service = new ListTenanciesService(repository);

    const result = await service.execute({ role: UserRole.SUPERADMIN });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected repository failure');
    expect(result.value).toBe(failure);
  });
});

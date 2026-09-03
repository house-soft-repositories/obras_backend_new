import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import CreateTenancyService from '@/modules/tenancy/application/create_tenancy.service';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { validTenancy } from '@test/constants/tenancy/domain/entities/tenancy.constants';
import mockTenancyRepository from '@test/mocks/tenancy/adapters/tenancy_repository.mock';

describe('CreateTenancyService', () => {
  it('allows a superadmin to provision a tenancy', async () => {
    const repository = mockTenancyRepository();
    repository.provision.mockImplementation((tenancy) => Promise.resolve(right(tenancy)));
    const service = new CreateTenancyService(repository);

    const result = await service.execute({
      ...validTenancy,
      creator: { id: 'creator-id', role: UserRole.SUPERADMIN },
    });

    expect(result.isRight()).toBe(true);
    expect(repository.provision.mock.calls[0][0]).toBeInstanceOf(TenancyEntity);
  });

  it('rejects a non-superadmin before provisioning', async () => {
    const repository = mockTenancyRepository();
    const service = new CreateTenancyService(repository);

    const result = await service.execute({
      ...validTenancy,
      creator: { id: 'creator-id', role: UserRole.ADMIN },
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.provision.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value.code).toBe(ErrorCodeConstants.TENANCY_CREATE_FORBIDDEN);
  });
});

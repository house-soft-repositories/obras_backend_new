import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import GetMeService from '@/modules/auth/application/get_me.service';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import { validTenancy } from '@test/constants/tenancy/domain/entities/tenancy.constants';
import mockUserRepository from '@test/mocks/users/adapters/user_repository.mock';

describe('GetMeService', () => {
  const tenantId = '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc';
  const userWithTenant = UserEntity.createUser(validUser, tenantId);
  const superadmin = UserEntity.create(
    validUser,
    UserRole.SUPERADMIN,
    null as any,
  );

  it('returns user with tenant object when user belongs to a tenancy', async () => {
    const users = mockUserRepository();
    users.findById.mockResolvedValue(right(userWithTenant));
    const tenancy = { id: tenantId, name: validTenancy.name } as TenancyModel;
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(tenancy),
      }),
    } as unknown as DataSource;

    const service = new GetMeService(users, dataSource);
    const result = await service.execute(userWithTenant.id);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.id).toBe(userWithTenant.id);
      expect(result.value.tenant).toEqual({ id: tenantId, name: validTenancy.name });
    }
  });

  it('returns user with null tenant when superadmin has no tenancy', async () => {
    const users = mockUserRepository();
    users.findById.mockResolvedValue(right(superadmin));
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
      }),
    } as unknown as DataSource;

    const service = new GetMeService(users, dataSource);
    const result = await service.execute(superadmin.id);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) expect(result.value.tenant).toBeNull();
  });

  it('returns null tenant when tenancy row is missing', async () => {
    const users = mockUserRepository();
    users.findById.mockResolvedValue(right(userWithTenant));
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    } as unknown as DataSource;

    const service = new GetMeService(users, dataSource);
    const result = await service.execute(userWithTenant.id);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) expect(result.value.tenant).toBeNull();
  });

  it('propagates user not found', async () => {
    const users = mockUserRepository();
    users.findById.mockResolvedValue(
      left({ code: ErrorCodeConstants.USER_NOT_FOUND, statusCode: 404 } as any),
    );
    const dataSource = {} as DataSource;
    const service = new GetMeService(users, dataSource);

    const result = await service.execute('missing-id');
    expect(result.isLeft()).toBe(true);
  });
});

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import ListUsersService from '@/modules/users/application/list_users.service';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import mockUserRepository from '@test/mocks/users/adapters/user_repository.mock';

describe('ListUsersService', () => {
  it('lists users from the authenticated admin tenant', async () => {
    const repository = mockUserRepository();
    const first = UserEntity.createUser(
      {
        name: 'Ana Silva',
        email: 'ana@example.com',
        password: 'hashed-password',
      },
      validUser.tenantId,
    );
    const second = UserEntity.createStaff(
      {
        name: 'Bruno Souza',
        email: 'bruno@example.com',
        password: 'hashed-password',
      },
      validUser.tenantId,
    );
    repository.listByTenantId.mockResolvedValue(right([first, second]));
    const service = new ListUsersService(repository);

    const result = await service.execute({
      requester: {
        id: 'creator-id',
        role: UserRole.ADMIN,
        tenantId: validUser.tenantId,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(repository.listByTenantId.mock.calls).toContainEqual([
      validUser.tenantId,
    ]);
    expect(result.getOrThrow().toResponse()).toEqual([
      expect.objectContaining({
        id: first.id,
        name: first.name,
        email: first.email,
        role: UserRole.USER,
        tenantId: validUser.tenantId,
      }),
      expect.objectContaining({
        id: second.id,
        name: second.name,
        email: second.email,
        role: UserRole.STAFF,
        tenantId: validUser.tenantId,
      }),
    ]);
    expect(result.getOrThrow().toResponse()[0]).not.toHaveProperty('password');
  });

  it('propagates repository failures', async () => {
    const repository = mockUserRepository();
    repository.listByTenantId.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
        }),
      ),
    );
    const service = new ListUsersService(repository);

    const result = await service.execute({
      requester: {
        id: 'creator-id',
        role: UserRole.ADMIN,
        tenantId: validUser.tenantId,
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected repository failure');
    expect(result.value.code).toBe(ErrorCodeConstants.USER_REPOSITORY_FAILED);
  });
});

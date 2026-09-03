import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import UserRequestContextPipe from '@/modules/auth/controller/user_request_context.pipe';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import mockUserRepository from '@test/mocks/users/adapters/user_repository.mock';

describe('UserRequestContextPipe', () => {
  it('injects persisted user data without its password', async () => {
    const users = mockUserRepository();
    const user = UserEntity.createUser(validUser, validUser.tenantId);
    users.findById.mockResolvedValue(right(user));
    const pipe = new UserRequestContextPipe(users);

    const context = await pipe.transform({
      sub: user.id,
      type: 'access',
      role: UserRole.USER,
      tenantId: user.tenantId,
    });

    expect(context).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
    expect(context).not.toHaveProperty('password');
  });

  it('rejects a token whose user no longer exists', async () => {
    const users = mockUserRepository();
    users.findById.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );
    const pipe = new UserRequestContextPipe(users);

    await expect(
      pipe.transform({
        sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
        type: 'access',
        role: UserRole.USER,
        tenantId: validUser.tenantId,
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

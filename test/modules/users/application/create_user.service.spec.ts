import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import CreateUserService from '@/modules/users/application/create_user.service';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import ICreateUserUseCase, {
  CreateUserParam,
} from '@/modules/users/domain/usecase/create_user.usecase';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import mockUserRepository from '@test/mocks/users/adapters/user_repository.mock';
import mockPasswordHasher from '@test/mocks/auth/adapters/password_hasher.mock';

describe('CreateUserService', () => {
  const ownTenantId = validUser.tenantId;
  const baseParam: Omit<CreateUserParam, 'creator'> = {
    name: validUser.name,
    email: validUser.email,
    passwordHash: validUser.password,
    role: UserRole.USER,
  };

  const passwordHasher = () => {
    const hasher = mockPasswordHasher();
    hasher.hash.mockResolvedValue('hashed-password');
    return hasher;
  };

  it('allows an admin to create staff in its verified tenant, ignoring target input', async () => {
    const repository = mockUserRepository();
    repository.findOne.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );
    repository.save.mockImplementation((user) => Promise.resolve(right(user)));
    const service: ICreateUserUseCase = new CreateUserService(
      repository,
      passwordHasher(),
    );

    const result = await service.execute({
      ...baseParam,
      role: UserRole.STAFF,
      tenantId: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      creator: {
        id: 'creator-id',
        role: UserRole.ADMIN,
        tenantId: ownTenantId,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(repository.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({ role: UserRole.STAFF, tenantId: ownTenantId }),
    );
  });

  it('allows a superadmin to create a user in the explicitly selected tenant', async () => {
    const repository = mockUserRepository();
    repository.findOne.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );
    repository.save.mockImplementation((user) => Promise.resolve(right(user)));
    const service = new CreateUserService(repository, passwordHasher());

    const result = await service.execute({
      ...baseParam,
      tenantId: ownTenantId,
      creator: { id: 'creator-id', role: UserRole.SUPERADMIN, tenantId: null },
    });

    expect(result.isRight()).toBe(true);
    expect(repository.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({ role: UserRole.USER, tenantId: ownTenantId }),
    );
  });

  it('rejects an admin without verified tenant context before persistence', async () => {
    const repository = mockUserRepository();
    const service = new CreateUserService(repository, passwordHasher());

    const result = await service.execute({
      ...baseParam,
      creator: { id: 'creator-id', role: UserRole.ADMIN, tenantId: null },
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.findOne.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value.code).toBe(ErrorCodeConstants.USER_CREATE_FORBIDDEN);
  });

  it('rejects duplicated email without persistence', async () => {
    const repository = mockUserRepository();
    repository.findOne.mockResolvedValue(
      right(UserEntity.createUser(validUser, ownTenantId)),
    );
    const service = new CreateUserService(repository, passwordHasher());

    const result = await service.execute({
      ...baseParam,
      creator: {
        id: 'creator-id',
        role: UserRole.ADMIN,
        tenantId: ownTenantId,
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected duplicate failure');
    expect(result.value.code).toBe(ErrorCodeConstants.USER_ALREADY_EXISTS);
  });
});

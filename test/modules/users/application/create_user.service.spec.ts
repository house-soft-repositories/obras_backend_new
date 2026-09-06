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

  it('rejects an admin that targets a tenancy other than its verified tenant', async () => {
    const repository = mockUserRepository();
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

    expect(result.isLeft()).toBe(true);
    expect(repository.findOne.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value.code).toBe(ErrorCodeConstants.USER_CREATE_FORBIDDEN);
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

  it('persists verified organizational references from the target tenant', async () => {
    const repository = mockUserRepository();
    const localidadeId = '6bb7e22a-877d-41e5-8b32-9acbed8f006e';
    const orgaoId = 'fe1e63ec-21cc-4d39-b8f6-072730c01b7f';
    const setorId = '02cf1429-fbd9-4dcf-a32b-269296185cd2';
    repository.findOne.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );
    repository.existsLocalidade.mockResolvedValue(right(true));
    repository.existsOrgao.mockResolvedValue(right(true));
    repository.findSetorById.mockResolvedValue(right({ id: setorId, orgaoId }));
    repository.save.mockImplementation((user) => Promise.resolve(right(user)));
    const service = new CreateUserService(repository, passwordHasher());

    const result = await service.execute({
      ...baseParam,
      localidadeId,
      orgaoId,
      setorId,
      creator: {
        id: 'creator-id',
        role: UserRole.ADMIN,
        tenantId: ownTenantId,
      },
    });

    expect(result.isRight()).toBe(true);
    expect(repository.existsLocalidade.mock.calls).toContainEqual([
      localidadeId,
      ownTenantId,
    ]);
    expect(repository.existsOrgao.mock.calls).toContainEqual([
      orgaoId,
      ownTenantId,
    ]);
    expect(repository.findSetorById.mock.calls).toContainEqual([
      setorId,
      ownTenantId,
    ]);
    expect(repository.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({ localidadeId, orgaoId, setorId }),
    );
  });

  it('rejects a sector that does not belong to the supplied organization', async () => {
    const repository = mockUserRepository();
    const orgaoId = 'fe1e63ec-21cc-4d39-b8f6-072730c01b7f';
    const setorId = '02cf1429-fbd9-4dcf-a32b-269296185cd2';
    repository.findOne.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );
    repository.existsOrgao.mockResolvedValue(right(true));
    repository.findSetorById.mockResolvedValue(
      right({ id: setorId, orgaoId: '92302f92-164c-4959-b7b9-bac311b1ad79' }),
    );
    const service = new CreateUserService(repository, passwordHasher());

    const result = await service.execute({
      ...baseParam,
      orgaoId,
      setorId,
      creator: {
        id: 'creator-id',
        role: UserRole.ADMIN,
        tenantId: ownTenantId,
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected invalid link failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.USER_INVALID_ORGANIZATIONAL_LINK,
      statusCode: 400,
    });
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

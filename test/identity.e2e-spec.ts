import { AppModule } from '@/app.module';
import { left, right } from '@/core/types/either';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import AuthServiceException from '@/modules/auth/exceptions/auth_service.exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ILoginUseCase from '@/modules/auth/domain/usecase/login.usecase';
import IRefreshTokenUseCase from '@/modules/auth/domain/usecase/refresh_token.usecase';
import ISwitchTenancyUseCase from '@/modules/auth/domain/usecase/switch_tenancy.usecase';
import {
  LOGIN_SERVICE,
  REFRESH_TOKEN_SERVICE,
  SWITCH_TENANCY_SERVICE,
  TOKEN_SERVICE,
} from '@/modules/auth/symbols';
import ICreateTenancyUseCase from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';
import { CREATE_TENANCY_SERVICE } from '@/modules/tenancy/symbols';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';
import { CreateUserResponse } from '@/modules/users/domain/usecase/create_user.usecase';
import IListUsersUseCase, {
  ListUsersResponse,
} from '@/modules/users/domain/usecase/list_users.usecase';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import { CREATE_USER_SERVICE, LIST_USERS_SERVICE } from '@/modules/users/symbols';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import { orgaoIds } from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import { validTenancy } from '@test/constants/tenancy/domain/entities/tenancy.constants';
import mockTokenService from '@test/mocks/auth/adapters/token_service.mock';
import mockLoginUseCase from '@test/mocks/auth/domain/usecase/login_usecase.mock';
import mockRefreshTokenUseCase from '@test/mocks/auth/domain/usecase/refresh_token_usecase.mock';
import mockCreateTenancyUseCase from '@test/mocks/tenancy/domain/usecase/create_tenancy_usecase.mock';
import mockCreateUserUseCase from '@test/mocks/users/domain/usecase/create_user_usecase.mock';
import mockListUsersUseCase from '@test/mocks/users/domain/usecase/list_users_usecase.mock';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Identity provisioning (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let login: jest.Mocked<ILoginUseCase>;
  let refresh: jest.Mocked<IRefreshTokenUseCase>;
  let switchTenancy: jest.Mocked<ISwitchTenancyUseCase>;
  let createTenancy: jest.Mocked<ICreateTenancyUseCase>;
  let createUser: jest.Mocked<ICreateUserUseCase>;
  let listUsers: jest.Mocked<IListUsersUseCase>;

  beforeEach(async () => {
    tokenService = mockTokenService();
    login = mockLoginUseCase();
    refresh = mockRefreshTokenUseCase();
    switchTenancy = { execute: jest.fn() };
    createTenancy = mockCreateTenancyUseCase();
    createUser = mockCreateUserUseCase();
    listUsers = mockListUsersUseCase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_SERVICE)
      .useValue(tokenService)
      .overrideProvider(LOGIN_SERVICE)
      .useValue(login)
      .overrideProvider(REFRESH_TOKEN_SERVICE)
      .useValue(refresh)
      .overrideProvider(SWITCH_TENANCY_SERVICE)
      .useValue(switchTenancy)
      .overrideProvider(CREATE_TENANCY_SERVICE)
      .useValue(createTenancy)
      .overrideProvider(CREATE_USER_SERVICE)
      .useValue(createUser)
      .overrideProvider(LIST_USERS_SERVICE)
      .useValue(listUsers)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns the token pair for valid login credentials', async () => {
    login.execute.mockResolvedValue(
      right({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ADMIN@EXAMPLE.COM', password: 'secret' })
      .expect(201);

    expect(response.body).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(login.execute.mock.calls).toContainEqual([
      {
        email: 'admin@example.com',
        password: 'secret',
        tenantId: null,
      },
    ]);
  });

  it('returns the rotated token pair for a valid refresh token', async () => {
    refresh.execute.mockResolvedValue(
      right({ accessToken: 'next-access', refreshToken: 'next-refresh' }),
    );
    const refreshToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature';

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(response.body).toEqual({
      accessToken: 'next-access',
      refreshToken: 'next-refresh',
    });
    expect(refresh.execute.mock.calls).toContainEqual([{ refreshToken }]);
  });

  it('switches an active tenancy only through a verified superadmin token', async () => {
    const tenancy = {
      id: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
      name: 'Tenant One',
      slug: 'tenant-one',
      cnpj: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.SUPERADMIN,
      tenantId: null,
    });
    switchTenancy.execute.mockResolvedValue(
      right({
        accessToken: 'tenant-access-token',
        refreshToken: 'tenant-refresh-token',
        tenancy,
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/auth/switch-tenancy')
      .set('Authorization', 'Bearer superadmin-access-token')
      .send({ tenantId: tenancy.id })
      .expect(201);

    expect(response.body).toMatchObject({
      accessToken: 'tenant-access-token',
      refreshToken: 'tenant-refresh-token',
      tenancy: {
        id: tenancy.id,
        name: tenancy.name,
        slug: tenancy.slug,
        cnpj: null,
        active: true,
      },
    });
    expect(switchTenancy.execute.mock.calls).toContainEqual([
      {
        user: {
          sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
          type: 'access',
          role: UserRole.SUPERADMIN,
          tenantId: null,
        },
        tenantId: tenancy.id,
      },
    ]);
  });

  it('rejects an unauthenticated tenancy-switch request before its use case runs', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/switch-tenancy')
      .send({ tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc' })
      .expect(401);

    expect(switchTenancy.execute.mock.calls).toHaveLength(0);
  });

  it('rejects an invalid target tenancy identifier before its use case runs', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.SUPERADMIN,
      tenantId: null,
    });

    await request(app.getHttpServer())
      .post('/api/auth/switch-tenancy')
      .set('Authorization', 'Bearer superadmin-access-token')
      .send({ tenantId: 'not-a-uuid' })
      .expect(400);

    expect(switchTenancy.execute.mock.calls).toHaveLength(0);
  });

  it('maps an unavailable tenancy switch to not found', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.SUPERADMIN,
      tenantId: null,
    });
    switchTenancy.execute.mockResolvedValue(
      left(
        new AuthServiceException({
          code: ErrorCodeConstants.AUTH_TENANCY_SWITCH_UNAVAILABLE,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/auth/switch-tenancy')
      .set('Authorization', 'Bearer superadmin-access-token')
      .send({ tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc' })
      .expect(404);

    const body = response.body as unknown as { message: string };
    expect(body.message).toBe(
      ErrorCodeConstants.AUTH_TENANCY_SWITCH_UNAVAILABLE,
    );
  });

  it('rejects an unauthenticated user-provisioning request before its use case runs', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
      })
      .expect(401);

    expect(createUser.execute.mock.calls).toHaveLength(0);
  });

  it('rejects a non-admin user-provisioning request before its use case runs', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.USER,
      tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    });

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer valid-access-token')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
      })
      .expect(401);

    expect(createUser.execute.mock.calls).toHaveLength(0);
  });

  it('rejects an invalid access token before a provisioning use case runs', async () => {
    tokenService.verifyAccess.mockRejectedValue(
      new Error('invalid access token'),
    );

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer invalid-access-token')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
      })
      .expect(401);

    expect(createUser.execute.mock.calls).toHaveLength(0);
  });

  it('allows an authenticated admin to submit user provisioning', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.ADMIN,
      tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    });
    createUser.execute.mockResolvedValue(
      right(
        new CreateUserResponse(
          UserEntity.fromData({
            id: 'created-user',
            email: validUser.email,
            createdAt: validUser.createdAt,
            name: validUser.name,
            password: '',
            role: UserRole.USER,
            tenantId: validUser.tenantId,
            localidadeId: null,
            orgaoId: null,
            setorId: null,
            updatedAt: validUser.updatedAt,
          }),
        ),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer valid-access-token')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 'created-user',
      email: validUser.email,
      role: UserRole.USER,
    });
    expect(response.body).not.toHaveProperty('password');
    expect(createUser.execute.mock.calls).toContainEqual([
      expect.objectContaining({
        creator: {
          id: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
          role: UserRole.ADMIN,
          tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
        },
      }),
    ]);
  });

  it('lists users from the authenticated tenant for an admin', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.ADMIN,
      tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    });
    listUsers.execute.mockResolvedValue(
      right(
        new ListUsersResponse([
          UserEntity.fromData({
            id: 'user-1',
            name: 'Ana',
            email: 'ana@example.com',
            password: 'hashed',
            role: UserRole.USER,
            tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
            localidadeId: null,
            orgaoId: null,
            setorId: null,
            createdAt: validUser.createdAt,
            updatedAt: validUser.updatedAt,
          }),
        ]),
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', 'Bearer valid-access-token')
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        role: UserRole.USER,
        tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
      }),
    ]);
    expect(response.body[0]).not.toHaveProperty('password');
    expect(listUsers.execute.mock.calls).toContainEqual([
      {
        requester: {
          id: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
          role: UserRole.ADMIN,
          tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
        },
      },
    ]);
  });

  it('allows a superadmin to submit user provisioning for another tenant', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.SUPERADMIN,
      tenantId: null,
    });
    createUser.execute.mockResolvedValue(
      right(
        new CreateUserResponse(
          UserEntity.fromData({
            id: 'created-user',
            email: validUser.email,
            createdAt: validUser.createdAt,
            name: validUser.name,
            password: 'hash',
            role: UserRole.USER,
            tenantId: validUser.tenantId,
            localidadeId: null,
            orgaoId: null,
            setorId: null,
            updatedAt: validUser.updatedAt,
          }),
        ),
      ),
    );

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer valid-access-token')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
        tenantId: validUser.tenantId,
      })
      .expect(201);

    expect(createUser.execute.mock.calls).toContainEqual([
      expect.objectContaining({
        tenantId: validUser.tenantId,
        creator: {
          id: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
          role: UserRole.SUPERADMIN,
          tenantId: null,
        },
      }),
    ]);
  });

  it('persists organizational references when provisioning a tenant user', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: orgaoIds.userId,
      type: 'access',
      role: UserRole.ADMIN,
      tenantId: orgaoIds.tenantId,
    });
    createUser.execute.mockResolvedValue(
      right(
        new CreateUserResponse(
          UserEntity.fromData({
            id: 'created-user',
            email: validUser.email,
            createdAt: validUser.createdAt,
            name: validUser.name,
            password: 'hash',
            role: UserRole.USER,
            tenantId: orgaoIds.tenantId,
            localidadeId: orgaoIds.localidadeId,
            orgaoId: orgaoIds.orgaoId,
            setorId: orgaoIds.setorId,
            updatedAt: validUser.updatedAt,
          }),
        ),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer valid-access-token')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
        localidadeId: orgaoIds.localidadeId,
        orgaoId: orgaoIds.orgaoId,
        setorId: orgaoIds.setorId,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 'created-user',
      localidadeId: orgaoIds.localidadeId,
      orgaoId: orgaoIds.orgaoId,
      setorId: orgaoIds.setorId,
    });
    expect(createUser.execute.mock.calls).toContainEqual([
      expect.objectContaining({
        localidadeId: orgaoIds.localidadeId,
        orgaoId: orgaoIds.orgaoId,
        setorId: orgaoIds.setorId,
        creator: {
          id: orgaoIds.userId,
          role: UserRole.ADMIN,
          tenantId: orgaoIds.tenantId,
        },
      }),
    ]);
  });

  it('maps missing organizational references to not found', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: orgaoIds.userId,
      type: 'access',
      role: UserRole.ADMIN,
      tenantId: orgaoIds.tenantId,
    });
    createUser.execute.mockResolvedValue(
      left(
        new UserRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', 'Bearer valid-access-token')
      .send({
        name: 'Tenant User',
        email: 'user@example.com',
        password: 'secret',
        role: UserRole.USER,
        localidadeId: orgaoIds.localidadeId,
      })
      .expect(404);

    expect(response.body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND);
    expect(createUser.execute.mock.calls).toContainEqual([
      expect.objectContaining({
        localidadeId: orgaoIds.localidadeId,
        creator: {
          id: orgaoIds.userId,
          role: UserRole.ADMIN,
          tenantId: orgaoIds.tenantId,
        },
      }),
    ]);
  });

  it('rejects an unauthenticated tenancy-provisioning request before its use case runs', async () => {
    await request(app.getHttpServer())
      .post('/api/tenancies')
      .send({ name: 'Tenant One', slug: 'tenant-one' })
      .expect(401);

    expect(createTenancy.execute.mock.calls).toHaveLength(0);
  });

  it('allows a superadmin to submit tenancy provisioning', async () => {
    tokenService.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.SUPERADMIN,
      tenantId: null,
    });
    const tenancy = TenancyEntity.create(validTenancy);
    createTenancy.execute.mockResolvedValue(right(tenancy));

    const response = await request(app.getHttpServer())
      .post('/api/tenancies')
      .set('Authorization', 'Bearer valid-access-token')
      .send({ name: 'Tenant One', slug: 'tenant-one' })
      .expect(201);

    expect(response.body).toMatchObject({
      id: tenancy.id,
      name: tenancy.name,
      slug: tenancy.slug,
      active: true,
    });
    expect(response.body).not.toHaveProperty('schemaName');

    expect(createTenancy.execute.mock.calls).toContainEqual([
      {
        name: 'Tenant One',
        slug: 'tenant-one',
        cnpj: null,
        creator: {
          id: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
          role: UserRole.SUPERADMIN,
        },
      },
    ]);
  });
});

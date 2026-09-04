import { AppModule } from '@/app.module';
import { right } from '@/core/types/either';
import ITokenService from '@/modules/auth/adapters/token_service.interface';
import ILoginUseCase from '@/modules/auth/domain/usecase/login.usecase';
import IRefreshTokenUseCase from '@/modules/auth/domain/usecase/refresh_token.usecase';
import {
  LOGIN_SERVICE,
  REFRESH_TOKEN_SERVICE,
  TOKEN_SERVICE,
} from '@/modules/auth/symbols';
import ICreateTenancyUseCase from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';
import { CREATE_TENANCY_SERVICE } from '@/modules/tenancy/symbols';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';
import { CreateUserResponse } from '@/modules/users/domain/usecase/create_user.usecase';
import { CREATE_USER_SERVICE } from '@/modules/users/symbols';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import mockTokenService from '@test/mocks/auth/adapters/token_service.mock';
import mockLoginUseCase from '@test/mocks/auth/domain/usecase/login_usecase.mock';
import mockRefreshTokenUseCase from '@test/mocks/auth/domain/usecase/refresh_token_usecase.mock';
import mockCreateTenancyUseCase from '@test/mocks/tenancy/domain/usecase/create_tenancy_usecase.mock';
import mockCreateUserUseCase from '@test/mocks/users/domain/usecase/create_user_usecase.mock';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Identity provisioning (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let login: jest.Mocked<ILoginUseCase>;
  let refresh: jest.Mocked<IRefreshTokenUseCase>;
  let createTenancy: jest.Mocked<ICreateTenancyUseCase>;
  let createUser: jest.Mocked<ICreateUserUseCase>;

  beforeEach(async () => {
    tokenService = mockTokenService();
    login = mockLoginUseCase();
    refresh = mockRefreshTokenUseCase();
    createTenancy = mockCreateTenancyUseCase();
    createUser = mockCreateUserUseCase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_SERVICE)
      .useValue(tokenService)
      .overrideProvider(LOGIN_SERVICE)
      .useValue(login)
      .overrideProvider(REFRESH_TOKEN_SERVICE)
      .useValue(refresh)
      .overrideProvider(CREATE_TENANCY_SERVICE)
      .useValue(createTenancy)
      .overrideProvider(CREATE_USER_SERVICE)
      .useValue(createUser)
      .compile();

    app = moduleFixture.createNestApplication();
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
        email: 'ADMIN@EXAMPLE.COM',
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
      .expect(403);

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
      right(new CreateUserResponse(UserEntity.fromData({
          id: 'created-user',
          email: validUser.email,
          createdAt: validUser.createdAt,
          name: validUser.name,
          password: '',
          role: UserRole.USER,
          tenantId: validUser.tenantId,
          updatedAt: validUser.updatedAt,
        }))),
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

  it('rejects an unauthenticated tenancy-provisioning request before its use case runs', async () => {
    await request(app.getHttpServer())
      .post('/api/tenancies')
      .send({ name: 'Tenant One', slug: 'tenant-one' })
      .expect(401);

    expect(createTenancy.execute.mock.calls).toHaveLength(0);
  });
});

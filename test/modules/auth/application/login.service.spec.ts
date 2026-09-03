import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import LoginService from '@/modules/auth/application/login.service';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import mockPasswordHasher from '@test/mocks/auth/adapters/password_hasher.mock';
import mockTokenService from '@test/mocks/auth/adapters/token_service.mock';
import mockUserSessionRepository from '@test/mocks/auth/adapters/user_session_repository.mock';
import mockUserRepository from '@test/mocks/users/adapters/user_repository.mock';

describe('LoginService', () => {
  it('returns generic invalid credentials when the user is absent', async () => {
    const users = mockUserRepository();
    const passwords = mockPasswordHasher();
    const tokens = mockTokenService();
    const sessions = mockUserSessionRepository();
    users.findOne.mockResolvedValue(
      left(new UserRepositoryException({ code: ErrorCodeConstants.USER_NOT_FOUND, statusCode: 404 })),
    );
    const service = new LoginService(users, passwords, tokens, sessions);

    const result = await service.execute({
      email: validUser.email,
      password: 'wrong-password',
      tenantId: validUser.tenantId,
    });

    expect(result.isLeft()).toBe(true);
    expect(passwords.compare.mock.calls).toHaveLength(0);
    expect(sessions.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected invalid credentials');
    expect(result.value.code).toBe(ErrorCodeConstants.AUTH_INVALID_CREDENTIALS);
  });

  it('returns the same generic invalid credentials error when the password does not match', async () => {
    const users = mockUserRepository();
    const passwords = mockPasswordHasher();
    const tokens = mockTokenService();
    const sessions = mockUserSessionRepository();
    const user = UserEntity.createUser(validUser, validUser.tenantId);
    users.findOne.mockResolvedValue(right(user));
    passwords.compare.mockResolvedValue(false);
    const service = new LoginService(users, passwords, tokens, sessions);

    const result = await service.execute({
      email: validUser.email,
      password: 'wrong-password',
      tenantId: validUser.tenantId,
    });

    expect(result.isLeft()).toBe(true);
    expect(sessions.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected invalid credentials');
    expect(result.value.code).toBe(ErrorCodeConstants.AUTH_INVALID_CREDENTIALS);
    expect(result.value.statusCode).toBe(401);
  });

  it('issues tokens and stores only the refresh hash for valid credentials', async () => {
    const users = mockUserRepository();
    const passwords = mockPasswordHasher();
    const tokens = mockTokenService();
    const sessions = mockUserSessionRepository();
    const user = UserEntity.createUser(validUser, validUser.tenantId);
    users.findOne.mockResolvedValue(right(user));
    passwords.compare.mockResolvedValue(true);
    tokens.signRefresh.mockResolvedValue('refresh-token');
    passwords.hash.mockResolvedValue('refresh-token-hash');
    sessions.save.mockImplementation((session) => Promise.resolve(right(session)));
    tokens.signAccess.mockResolvedValue('access-token');
    const service = new LoginService(users, passwords, tokens, sessions);

    const result = await service.execute({
      email: validUser.email,
      password: 'plain-password',
      tenantId: validUser.tenantId,
    });

    expect(result.isRight()).toBe(true);
    expect(sessions.save.mock.calls[0][0].refreshTokenHash).toBe('refresh-token-hash');
    expect(sessions.save.mock.calls[0][0].refreshTokenHash).not.toBe('refresh-token');
    expect(tokens.signAccess.mock.calls).toContainEqual([{
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    }]);
    expect(tokens.signRefresh.mock.calls).toContainEqual([{
      sub: user.id,
      sid: sessions.save.mock.calls[0][0].id,
    }]);
    if (result.isLeft()) throw result.value;
    expect(result.value).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});

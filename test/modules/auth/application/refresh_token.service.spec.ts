import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import RefreshTokenService from '@/modules/auth/application/refresh_token.service';
import UserSessionEntity from '@/modules/auth/domain/entities/user_session.entity';
import AuthTokenException from '@/modules/auth/exceptions/auth_token.exception';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { validUser } from '@test/constants/users/domain/entities/user.constants';
import mockPasswordHasher from '@test/mocks/auth/adapters/password_hasher.mock';
import mockTokenService from '@test/mocks/auth/adapters/token_service.mock';
import mockUserSessionRepository from '@test/mocks/auth/adapters/user_session_repository.mock';
import mockUserRepository from '@test/mocks/users/adapters/user_repository.mock';

describe('RefreshTokenService', () => {
  it('revokes the current session before persisting the rotated session', async () => {
    const users = mockUserRepository();
    const passwords = mockPasswordHasher();
    const tokens = mockTokenService();
    const sessions = mockUserSessionRepository();
    const user = UserEntity.createUser(validUser, validUser.tenantId);
    const session = UserSessionEntity.create({
      userId: user.id,
      refreshTokenHash: 'stored-hash',
      expiresAt: new Date(Date.now() + 60_000),
    });
    tokens.verifyRefresh.mockResolvedValue({ sub: user.id, sid: session.id, type: 'refresh' });
    sessions.findActiveById.mockResolvedValue(right(session));
    passwords.compare.mockResolvedValue(true);
    users.findById.mockResolvedValue(right(user));
    sessions.revoke.mockResolvedValue(right(undefined));
    tokens.signRefresh.mockResolvedValue('rotated-refresh-token');
    passwords.hash.mockResolvedValue('rotated-refresh-hash');
    sessions.save.mockImplementation((nextSession) => Promise.resolve(right(nextSession)));
    tokens.signAccess.mockResolvedValue('rotated-access-token');
    const service = new RefreshTokenService(users, passwords, tokens, sessions);

    const result = await service.execute({ refreshToken: 'current-refresh-token' });

    expect(result.isRight()).toBe(true);
    expect(sessions.revoke.mock.invocationCallOrder[0]).toBeLessThan(
      sessions.save.mock.invocationCallOrder[0],
    );
    expect(sessions.save.mock.calls[0][0].refreshTokenHash).toBe('rotated-refresh-hash');
    if (result.isLeft()) throw result.value;
    expect(result.value).toEqual({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });
  });

  it.each([
    'malformed',
    'expired',
    'revoked',
    'access-type',
    'hash-mismatched',
  ])('rejects a %s refresh token without issuing tokens', async (scenario) => {
    const users = mockUserRepository();
    const passwords = mockPasswordHasher();
    const tokens = mockTokenService();
    const sessions = mockUserSessionRepository();
    const service = new RefreshTokenService(users, passwords, tokens, sessions);

    if (scenario === 'malformed' || scenario === 'access-type') {
      tokens.verifyRefresh.mockRejectedValue(new AuthTokenException({}));
    } else if (scenario === 'hash-mismatched') {
      const session = UserSessionEntity.create({
        userId: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
        refreshTokenHash: 'stored-hash',
        expiresAt: new Date(Date.now() + 60_000),
      });
      tokens.verifyRefresh.mockResolvedValue({ sub: session.userId, sid: session.id, type: 'refresh' });
      sessions.findActiveById.mockResolvedValue(right(session));
      passwords.compare.mockResolvedValue(false);
    } else {
      tokens.verifyRefresh.mockResolvedValue({
        sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
        sid: '0c4d7c37-2455-4634-9ce4-37ce30bd8f78',
        type: 'refresh',
      });
      sessions.findActiveById.mockResolvedValue(
        left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_NOT_FOUND,
            statusCode: 404,
          }),
        ),
      );
    }

    const result = await service.execute({ refreshToken: 'invalid-refresh-token' });

    expect(result.isLeft()).toBe(true);
    expect(tokens.signAccess.mock.calls).toHaveLength(0);
    expect(tokens.signRefresh.mock.calls).toHaveLength(0);
    expect(sessions.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected invalid refresh token');
    expect(result.value.code).toBe(ErrorCodeConstants.AUTH_INVALID_REFRESH_TOKEN);
    expect(result.value.statusCode).toBe(401);
  });
});

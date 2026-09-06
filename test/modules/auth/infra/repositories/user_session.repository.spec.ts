import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import UserSessionRepository from '@/modules/auth/infra/repositories/user_session.repository';
import UserSessionModel from '@/modules/auth/infra/models/user_session.model';
import UserModel from '@/modules/users/infra/models/user.model';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

describe('UserSessionRepository', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [UserModel, UserSessionModel],
  });
  const userIds: string[] = [];
  const sessionIds: string[] = [];

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterEach(async () => {
    const sessions = sessionIds.splice(0);
    if (sessions.length > 0)
      await dataSource.getRepository(UserSessionModel).delete(sessions);
    const users = userIds.splice(0);
    if (users.length > 0)
      await dataSource.getRepository(UserModel).delete(users);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it.each([
    ['expired', new Date(Date.now() - 60_000), null],
    ['revoked', new Date(Date.now() + 60_000), new Date()],
  ])(
    'does not resolve a %s refresh session as active',
    async (_state, expiresAt, revokedAt) => {
      const userId = randomUUID();
      const sessionId = randomUUID();
      userIds.push(userId);
      sessionIds.push(sessionId);
      await dataSource.getRepository(UserModel).insert({
        id: userId,
        name: 'Platform User',
        email: `${userId}@example.com`,
        password: 'hash',
        role: UserRole.SUPERADMIN,
        tenantId: null,
      });
      await dataSource.getRepository(UserSessionModel).insert({
        id: sessionId,
        userId,
        refreshTokenHash: 'bcrypt-hash',
        expiresAt,
        revokedAt,
      });
      const repository = new UserSessionRepository(
        dataSource.getRepository(UserSessionModel),
      );

      const result = await repository.findActiveById(sessionId);

      expect(result.isLeft()).toBe(true);
    },
  );
});

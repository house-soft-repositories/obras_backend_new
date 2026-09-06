import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('identity fixture ownership', () => {
  it.each([
    'test/constants/users/domain/entities/user.constants.ts',
    'test/constants/tenancy/domain/entities/tenancy.constants.ts',
    'test/mocks/auth/adapters/password_hasher.mock.ts',
    'test/mocks/auth/adapters/token_service.mock.ts',
    'test/mocks/auth/adapters/user_session_repository.mock.ts',
    'test/mocks/tenancy/adapters/tenancy_repository.mock.ts',
    'test/mocks/users/adapters/user_repository.mock.ts',
  ])('keeps %s in the module and layer that owns it', (fixturePath) => {
    expect(existsSync(resolve(process.cwd(), fixturePath))).toBe(true);
  });
});

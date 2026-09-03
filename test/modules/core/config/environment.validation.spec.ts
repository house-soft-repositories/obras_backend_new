import 'reflect-metadata';
import { validateEnvironmentVariables } from '@/core/config/enviroment.validation';

const validEnvironment = {
  NODE_ENV: 'TST',
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5432',
  DATABASE_USERNAME: 'postgres',
  DATABASE_PASSWORD: 'secret',
  DATABASE_NAME: 'obras',
  DATABASE_MAX_POOL_CONNECTIONS: '10',
  SALT: '10',
  JWT_SECRET: 'test-secret',
  PORT: 3000,
};

describe('validateEnvironmentVariables', () => {
  it('accepts a JWT secret and a safe bcrypt cost', () => {
    const result = validateEnvironmentVariables(validEnvironment);

    expect(result.JWT_SECRET).toBe('test-secret');
    expect(result.SALT).toBe(10);
  });

  it.each([
    ['missing', undefined],
    ['non-numeric', 'invalid'],
    ['below the safe range', '9'],
    ['above the safe range', '15'],
  ])('rejects a %s bcrypt cost', (_description, salt) => {
    expect(() =>
      validateEnvironmentVariables({ ...validEnvironment, SALT: salt }),
    ).toThrow();
  });

  it('rejects a missing JWT secret', () => {
    expect(() =>
      validateEnvironmentVariables({ ...validEnvironment, JWT_SECRET: '' }),
    ).toThrow();
  });
});

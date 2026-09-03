import BcryptPasswordHasher from '@/modules/auth/infra/password/bcrypt_password_hasher';
import mockConfigurationService from '@test/mocks/core/services/configuration_service.mock';

describe('BcryptPasswordHasher', () => {
  it('hashes and compares a password using the configured cost', async () => {
    const configuration = mockConfigurationService();
    const hasher = new BcryptPasswordHasher(configuration);
    const hash = await hasher.hash('plain-password');

    expect(hash).not.toBe('plain-password');
    await expect(hasher.compare('plain-password', hash)).resolves.toBe(true);
    await expect(hasher.compare('different-password', hash)).resolves.toBe(false);
    expect(configuration.get.mock.calls).toContainEqual(['SALT']);
  });
});

import bcrypt from 'bcryptjs';
import ConfigurationService from '@/core/services/configuration.service';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';

export default class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly configurationService: ConfigurationService) {}

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.configurationService.get('SALT'));
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}

import CoreModule from '@/core/core.module';
import ConfigurationService from '@/core/services/configuration.service';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import BcryptPasswordHasher from '@/modules/auth/infra/password/bcrypt_password_hasher';
import { PASSWORD_HASHER } from '@/modules/auth/symbols';
import { Module } from '@nestjs/common';

@Module({
  imports: [CoreModule],
  providers: [
    {
      provide: PASSWORD_HASHER,
      inject: [ConfigurationService],
      useFactory: (configuration: ConfigurationService): IPasswordHasher =>
        new BcryptPasswordHasher(configuration),
    },
  ],
  exports: [PASSWORD_HASHER],
})
export default class PasswordModule {}

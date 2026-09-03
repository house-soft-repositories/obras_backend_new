import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import CreateUserService from '@/modules/users/application/create_user.service';
import IPasswordHasher from '@/modules/auth/adapters/password_hasher.interface';
import PasswordModule from '@/modules/auth/password.module';
import { PASSWORD_HASHER } from '@/modules/auth/symbols';
import ICreateUserUseCase from '@/modules/users/domain/usecase/create_user.usecase';
import UserModel from '@/modules/users/infra/models/user.model';
import UserRepository from '@/modules/users/infra/repositories/user.repository';
import { CREATE_USER_SERVICE, USER_REPOSITORY } from '@/modules/users/symbols';

@Module({
  imports: [TypeOrmModule.forFeature([UserModel]), PasswordModule],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [getRepositoryToken(UserModel)],
      useFactory: (repository: Repository<UserModel>): IUserRepository =>
        new UserRepository(repository),
    },
    {
      provide: CREATE_USER_SERVICE,
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
      useFactory: (
        repository: IUserRepository,
        passwordHasher: IPasswordHasher,
      ): ICreateUserUseCase =>
        new CreateUserService(repository, passwordHasher),
    },
  ],
  exports: [USER_REPOSITORY, CREATE_USER_SERVICE],
})
export default class UsersModule {}

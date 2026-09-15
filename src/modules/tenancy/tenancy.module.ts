import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import CreateTenancyService from '@/modules/tenancy/application/create_tenancy.service';
import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import TenancyRepository from '@/modules/tenancy/infra/repositories/tenancy.repository';
import ICreateTenancyUseCase from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';
import ListTenanciesService from '@/modules/tenancy/application/list_tenancies.service';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import IListTenanciesUseCase from '@/modules/tenancy/domain/usecase/list_tenancies.usecase';
import { CREATE_TENANCY_SERVICE, LIST_TENANCIES_SERVICE, TENANCY_REPOSITORY } from '@/modules/tenancy/symbols';
import StorageModule from '@/modules/storage/storage.module';
import { STORAGE_SERVICE } from '@/modules/storage/symbols';

@Module({
  imports: [TypeOrmModule.forFeature([TenancyModel]), StorageModule],
  providers: [
    {
      provide: TENANCY_REPOSITORY,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => new TenancyRepository(dataSource),
    },
    {
      provide: CREATE_TENANCY_SERVICE,
      inject: [TENANCY_REPOSITORY, STORAGE_SERVICE],
      useFactory: (
        repository: ITenancyRepository,
        storage: IStorageService,
      ): ICreateTenancyUseCase => new CreateTenancyService(repository, storage),
    },
    {
      provide: LIST_TENANCIES_SERVICE,
      inject: [TENANCY_REPOSITORY],
      useFactory: (repository: ITenancyRepository): IListTenanciesUseCase =>
        new ListTenanciesService(repository),
    },
  ],
  exports: [CREATE_TENANCY_SERVICE, LIST_TENANCIES_SERVICE],
})
export default class TenancyModule {}

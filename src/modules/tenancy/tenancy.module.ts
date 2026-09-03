import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import CreateTenancyService from '@/modules/tenancy/application/create_tenancy.service';
import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import TenancyRepository from '@/modules/tenancy/infra/repositories/tenancy.repository';
import ICreateTenancyUseCase from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';
import { CREATE_TENANCY_SERVICE, TENANCY_REPOSITORY } from '@/modules/tenancy/symbols';

@Module({
  imports: [TypeOrmModule.forFeature([TenancyModel])],
  providers: [
    {
      provide: TENANCY_REPOSITORY,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => new TenancyRepository(dataSource),
    },
    {
      provide: CREATE_TENANCY_SERVICE,
      inject: [TENANCY_REPOSITORY],
      useFactory: (repository: ITenancyRepository): ICreateTenancyUseCase =>
        new CreateTenancyService(repository),
    },
  ],
  exports: [CREATE_TENANCY_SERVICE],
})
export default class TenancyModule {}

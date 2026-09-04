import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ITenancyRepository from '@/modules/tenancy/adapters/tenancy_repository.interface';
import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import TenancyMapper from '@/modules/tenancy/infra/mapper/tenancy.mapper';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import TenancyRepositoryException from '@/modules/tenancy/exceptions/tenancy_repository.exception';
import TenancyReadModel from '@/modules/tenancy/domain/read_models/tenancy.read_model';

export default class TenancyRepository implements ITenancyRepository {
  constructor(private readonly dataSource: DataSource) {}

  async provision(tenancy: TenancyEntity): AsyncResult<AppException, TenancyEntity> {
    try {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schemaName)) {
        return left(
          new TenancyRepositoryException({
            code: ErrorCodeConstants.TENANCY_INVALID_SCHEMA,
            statusCode: 400,
          }),
        );
      }

      const saved = await this.dataSource.transaction(async (manager) => {
        await manager.query(`CREATE SCHEMA "${tenancy.schemaName}"`);
        const repository = manager.getRepository(TenancyModel);
        return repository.save(repository.create(TenancyMapper.toModel(tenancy)));
      });

      return right(TenancyMapper.toEntity(saved));
    } catch (error) {
      return left(
        new TenancyRepositoryException({
          code: ErrorCodeConstants.TENANCY_PROVISION_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
  async findAll(): AsyncResult<AppException, TenancyReadModel[]> {
    try {
      const models = await this.dataSource.getRepository(TenancyModel).find();
      return right(models.map((model) => TenancyMapper.toReadModel(model)));
    }
    catch (error) { return left(new TenancyRepositoryException({ code: ErrorCodeConstants.TENANCY_PROVISION_FAILED, statusCode: 500, cause: error })); }
  }
}

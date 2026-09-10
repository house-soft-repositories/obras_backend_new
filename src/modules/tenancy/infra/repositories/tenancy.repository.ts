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
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export default class TenancyRepository implements ITenancyRepository {
  constructor(private readonly dataSource: DataSource) {}




  async existsBySlugOrCnpj(slug: string, cnpj: string | null): AsyncResult<AppException, boolean> {
    try {
      const qb = this.dataSource.getRepository(TenancyModel).createQueryBuilder('tenancy').where('tenancy.slug = :slug', { slug });
      if (cnpj) {
        qb.orWhere('tenancy.cnpj = :cnpj', { cnpj });
      }
      const exists = await qb.getExists();
      return right(exists);
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

  async provision(tenancy: TenancyEntity): AsyncResult<AppException, TenancyEntity> {
    try {
     

      const saved = await this.dataSource.transaction(async (manager) => {
        await manager.query(`CREATE SCHEMA "${tenancy.schemaName}"`);
        await TenantIdentitySchema.create(manager, tenancy.schemaName);
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

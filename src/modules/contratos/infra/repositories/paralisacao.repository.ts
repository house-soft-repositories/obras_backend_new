import { DataSource, EntityManager } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import ParalisacaoRepositoryException from '@/modules/contratos/exceptions/paralisacao_repository.exception';
import ParalisacaoMapper from '@/modules/contratos/infra/mapper/paralisacao.mapper';
import { ParalisacaoModel } from '@/modules/contratos/infra/models/paralisacao.model';
import { withTenantManager } from '@/modules/contratos/infra/repositories/tenant_repository.helper';

export default class ParalisacaoRepository implements IParalisacaoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: ParalisacaoEntity,
  ): AsyncResult<AppException, ParalisacaoEntity> {
    try {
      const saved = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const repository = manager.getRepository(ParalisacaoModel);
          const model = repository.create(ParalisacaoMapper.toModel(entity));
          const result = await repository.save(model);

          return ParalisacaoMapper.toEntity(result);
        },
      );

      return right(saved);
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listByContrato(
    contratoId: string,
  ): AsyncResult<AppException, ParalisacaoEntity[]> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const paralisacoes = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const models = await manager.getRepository(ParalisacaoModel).find({
            where: { contratoId, tenantId },
            order: { dataParalisacao: 'ASC' },
          });

          return models.map((model) => ParalisacaoMapper.toEntity(model));
        },
      );

      return right(paralisacoes);
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, ParalisacaoEntity | null> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const found = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const model = await manager.getRepository(ParalisacaoModel).findOne({
            where: { id, tenantId },
          });

          return model ? ParalisacaoMapper.toEntity(model) : null;
        },
      );

      return right(found);
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async delete(id: string): AsyncResult<AppException, void> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          await manager.getRepository(ParalisacaoModel).delete({ id, tenantId });
        },
      );

      return right(undefined);
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

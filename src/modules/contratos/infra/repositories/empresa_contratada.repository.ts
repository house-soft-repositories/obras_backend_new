import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, Not } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import EmpresaRepositoryException from '@/modules/contratos/exceptions/empresa_repository.exception';
import EmpresaContratadaMapper from '@/modules/contratos/infra/mapper/empresa_contratada.mapper';
import {
  EmpresaContratadaModel,
  EmpresaContratadaTelefoneModel,
} from '@/modules/contratos/infra/models/empresa_contratada.model';
import { withTenantManager } from '@/modules/contratos/infra/repositories/tenant_repository.helper';

export default class EmpresaContratadaRepository
  implements IEmpresaContratadaRepository
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: EmpresaContratadaEntity,
  ): AsyncResult<AppException, EmpresaContratadaEntity> {
    try {
      const saved = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const empresaRepository = manager.getRepository(
            EmpresaContratadaModel,
          );
          const telefoneRepository = manager.getRepository(
            EmpresaContratadaTelefoneModel,
          );
          const model = empresaRepository.create(
            EmpresaContratadaMapper.toModel(entity),
          );

          await empresaRepository.save(model);
          await telefoneRepository.delete({ empresaContratadaId: entity.id });

          const telefones = entity.telefones.map((numero) =>
            telefoneRepository.create({
              id: randomUUID(),
              tenantId: entity.tenantId,
              empresaContratadaId: entity.id,
              numero,
              createdAt: new Date(),
            }),
          );
          if (telefones.length) await telefoneRepository.save(telefones);

          return this.findOneWithTelefones(manager, entity.id);
        },
      );

      return right(saved ?? entity);
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, EmpresaContratadaEntity | null> {
    try {
      const found = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager: EntityManager) => this.findOneWithTelefones(manager, id),
      );

      return right(found);
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findPage(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EmpresaContratadaEntity>> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const page = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const repository = manager.getRepository(EmpresaContratadaModel);
          const [models, itemCount] = await repository.findAndCount({
            where: { tenantId },
            order: { razaoSocial: pageOptions.order },
            take: pageOptions.take,
            skip: pageOptions.skip,
          });
          const entities = await Promise.all(
            models.map((model) => this.mapWithTelefones(manager, model)),
          );
          const meta = new PageMetaEntity({ pageOptions, itemCount });

          return new PageEntity(entities, meta);
        },
      );

      return right(page);
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async existsCnpj(
    cnpj: string,
    excludeId?: string,
  ): AsyncResult<AppException, boolean> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const exists = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager: EntityManager) =>
          manager.getRepository(EmpresaContratadaModel).exists({
            where: {
              cnpj,
              tenantId,
              ...(excludeId ? { id: Not(excludeId) } : {}),
            },
          }),
      );

      return right(exists);
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
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
          await manager.getRepository(EmpresaContratadaModel).delete({
            id,
            tenantId,
          });
        },
      );

      return right(undefined);
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  private async findOneWithTelefones(manager: EntityManager, id: string) {
    const tenantId = this.tenantContext.require().tenantId;
    const model = await manager.getRepository(EmpresaContratadaModel).findOne({
      where: { id, tenantId },
    });

    return model ? this.mapWithTelefones(manager, model) : null;
  }

  private async mapWithTelefones(
    manager: EntityManager,
    model: EmpresaContratadaModel,
  ) {
    const tenantId = this.tenantContext.require().tenantId;
    const telefones = await manager
      .getRepository(EmpresaContratadaTelefoneModel)
      .find({
        where: { empresaContratadaId: model.id, tenantId },
        order: { createdAt: 'ASC' },
      });

    return EmpresaContratadaMapper.toEntity({
      ...model,
      telefones: telefones.map((telefone) => telefone.numero),
    });
  }
}

import { DataSource, EntityManager, IsNull } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoMapper from '@/modules/contratos/infra/mapper/contrato.mapper';
import {
  ContratoFonteModel,
  ContratoModel,
} from '@/modules/contratos/infra/models/contrato.model';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { withTenantManager } from '@/modules/contratos/infra/repositories/tenant_repository.helper';

export default class ContratoRepository implements IContratoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: ContratoEntity): AsyncResult<AppException, ContratoEntity> {
    try {
      const saved = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const contratoRepository = manager.getRepository(ContratoModel);
          const fonteRepository = manager.getRepository(ContratoFonteModel);
          const model = contratoRepository.create(
            ContratoMapper.toModel(entity),
          );

          await contratoRepository.save(model);
          await fonteRepository.delete({ contratoId: entity.id });
          const fontes = ContratoMapper.toFonteModels(entity);
          if (fontes.length) await fonteRepository.save(fontes);

          return this.findOneWithFontes(manager, entity.id);
        },
      );

      return right(saved ?? entity);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, ContratoEntity | null> {
    try {
      const found = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager: EntityManager) => this.findOneWithFontes(manager, id),
      );

      return right(found);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findPage(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<ContratoEntity>> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const page = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const repository = manager.getRepository(ContratoModel);
          const [models, itemCount] = await repository.findAndCount({
            where: { tenantId },
            order: { createdAt: pageOptions.order },
            take: pageOptions.take,
            skip: pageOptions.skip,
          });
          const entities = await Promise.all(
            models.map((model) => this.mapWithFontes(manager, model)),
          );
          const meta = new PageMetaEntity({ pageOptions, itemCount });

          return new PageEntity(entities, meta);
        },
      );

      return right(page);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findByObraSingle(
    obraId: string,
  ): AsyncResult<AppException, ContratoEntity | null> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const found = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const model = await manager.getRepository(ContratoModel).findOne({
            where: { obraId, tenantId },
          });

          return model ? this.mapWithFontes(manager, model) : null;
        },
      );

      return right(found);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async existsObraAtiva(obraId: string): AsyncResult<AppException, boolean> {
    try {
      const exists = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager: EntityManager) =>
          manager.getRepository(ObraModel).exists({
            where: { id: obraId, deletedAt: IsNull() },
          }),
      );

      return right(exists);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async existsFonte(fonteId: string): AsyncResult<AppException, boolean> {
    try {
      const exists = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager: EntityManager) =>
          manager.getRepository(FonteModel).exists({ where: { id: fonteId } }),
      );

      return right(exists);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async getObraCalendario(
    obraId: string,
  ): AsyncResult<
    AppException,
    { considerarSabado: boolean; considerarDomingo: boolean } | null
  > {
    try {
      const calendario = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const obra = await manager.getRepository(ObraModel).findOne({
            select: { considerarSabado: true, considerarDomingo: true },
            where: { id: obraId, deletedAt: IsNull() },
          });

          return obra
            ? {
                considerarSabado: obra.considerarSabado,
                considerarDomingo: obra.considerarDomingo,
              }
            : null;
        },
      );

      return right(calendario);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
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
          await manager
            .getRepository(ContratoModel)
            .delete({ id, tenantId });
        },
      );

      return right(undefined);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  private async findOneWithFontes(manager: EntityManager, id: string) {
    const tenantId = this.tenantContext.require().tenantId;
    const model = await manager.getRepository(ContratoModel).findOne({
      where: { id, tenantId },
    });

    return model ? this.mapWithFontes(manager, model) : null;
  }

  private async mapWithFontes(manager: EntityManager, model: ContratoModel) {
    const tenantId = this.tenantContext.require().tenantId;
    const fontes = await manager.getRepository(ContratoFonteModel).find({
      where: { contratoId: model.id, tenantId },
      order: { id: 'ASC' },
    });

    return ContratoMapper.toEntity({
      ...model,
      fontes: fontes.map((fonte: ContratoFonteModel) => ({
        fonteId: fonte.fonteId,
        valor: fonte.valor,
      })),
    });
  }
}

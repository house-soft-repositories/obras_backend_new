import { DataSource, EntityManager } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import AditivoRepositoryException from '@/modules/contratos/exceptions/aditivo_repository.exception';
import AditivoMapper from '@/modules/contratos/infra/mapper/aditivo.mapper';
import {
  AditivoFonteModel,
  AditivoModel,
} from '@/modules/contratos/infra/models/aditivo.model';
import { withTenantManager } from '@/modules/contratos/infra/repositories/tenant_repository.helper';

export default class AditivoRepository implements IAditivoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: AditivoEntity): AsyncResult<AppException, AditivoEntity> {
    try {
      const saved = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const aditivoRepository = manager.getRepository(AditivoModel);
          const fonteRepository = manager.getRepository(AditivoFonteModel);

          const existing = await aditivoRepository.findOne({
            where: {
              tenantId: entity.tenantId,
              contratoId: entity.contratoId,
              numero: entity.numero,
            },
          });

          const model = aditivoRepository.create({
            ...AditivoMapper.toModel(entity),
            id: existing?.id ?? entity.id,
            createdAt: existing?.createdAt ?? entity.toObject().createdAt,
          });

          await aditivoRepository.save(model);
          await fonteRepository.delete({ aditivoId: model.id });

          const fontes = AditivoMapper.toFonteModels(
            AditivoEntity.fromData({ ...entity.toObject(), id: model.id }),
          );
          if (fontes.length) await fonteRepository.save(fontes);

          return this.findOneWithFontes(manager, model.id);
        },
      );

      return right(saved ?? entity);
    } catch (cause) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listByContrato(
    contratoId: string,
  ): AsyncResult<AppException, AditivoEntity[]> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const aditivos = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const models = await manager.getRepository(AditivoModel).find({
            where: { contratoId, tenantId },
            order: { createdAt: 'ASC' },
          });

          return Promise.all(
            models.map((model) => this.mapWithFontes(manager, model)),
          );
        },
      );

      return right(aditivos);
    } catch (cause) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, AditivoEntity | null> {
    try {
      const found = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager: EntityManager) => this.findOneWithFontes(manager, id),
      );

      return right(found);
    } catch (cause) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
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
          await manager.getRepository(AditivoModel).delete({ id, tenantId });
        },
      );

      return right(undefined);
    } catch (cause) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  private async findOneWithFontes(manager: EntityManager, id: string) {
    const tenantId = this.tenantContext.require().tenantId;
    const model = await manager.getRepository(AditivoModel).findOne({
      where: { id, tenantId },
    });

    return model ? this.mapWithFontes(manager, model) : null;
  }

  private async mapWithFontes(manager: EntityManager, model: AditivoModel) {
    const tenantId = this.tenantContext.require().tenantId;
    const fontes = await manager.getRepository(AditivoFonteModel).find({
      where: { aditivoId: model.id, tenantId },
      order: { id: 'ASC' },
    });

    return AditivoMapper.toEntity({
      ...model,
      fontes: fontes.map((fonte) => ({
        fonteId: fonte.fonteId,
        valor: fonte.valor,
      })),
    });
  }
}

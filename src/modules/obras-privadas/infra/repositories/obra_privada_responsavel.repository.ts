import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import { withTenantManager } from '@/core/multitenancy/tenant_manager';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraPrivadaResponsavelRepository, {
  ObraPrivadaResponsavelUpdate,
} from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import ObraPrivadaResponsavelRepositoryException from '@/modules/obras-privadas/exceptions/obra_privada_responsavel_repository.exception';
import ObraPrivadaResponsavelMapper from '@/modules/obras-privadas/infra/mapper/obra_privada_responsavel.mapper';
import ObraPrivadaResponsavelModel from '@/modules/obras-privadas/infra/models/obra_privada_responsavel.model';

export default class ObraPrivadaResponsavelRepository
  implements IObraPrivadaResponsavelRepository
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: ObraPrivadaResponsavelEntity,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const saved = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          const repository = manager.getRepository(ObraPrivadaResponsavelModel);
          return repository.save(
            repository.create({
              ...ObraPrivadaResponsavelMapper.toModel(entity),
              tenantId,
            }),
          );
        },
      );
      return right(ObraPrivadaResponsavelMapper.toEntity(saved));
    } catch (cause) {
      const isConflict = this.isUniqueViolation(cause);
      return left(
        new ObraPrivadaResponsavelRepositoryException({
          code: isConflict
            ? ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT
            : ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
          statusCode: isConflict ? 409 : 500,
          cause,
        }),
      );
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity | null> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const model = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager) =>
          manager
            .getRepository(ObraPrivadaResponsavelModel)
            .findOne({ where: { id, tenantId } }),
      );
      return right(model ? ObraPrivadaResponsavelMapper.toEntity(model) : null);
    } catch (cause) {
      return left(
        new ObraPrivadaResponsavelRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity[]> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const models = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager) =>
          manager
            .getRepository(ObraPrivadaResponsavelModel)
            .createQueryBuilder('responsavel')
            .where('responsavel.obraPrivadaId = :obraPrivadaId', {
              obraPrivadaId,
            })
            .andWhere('responsavel.tenantId = :tenantId', { tenantId })
            .orderBy('responsavel.dataBaixa', 'ASC', 'NULLS FIRST')
            .addOrderBy('responsavel.createdAt', 'DESC')
            .getMany(),
      );
      return right(
        models.map((model) => ObraPrivadaResponsavelMapper.toEntity(model)),
      );
    } catch (cause) {
      return left(
        new ObraPrivadaResponsavelRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async existsActiveByObraPrivadaIdAndPapel(
    obraPrivadaId: string,
    papel: string,
    excludedId?: string,
  ): AsyncResult<AppException, boolean> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const exists = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        (manager) =>
          manager
            .getRepository(ObraPrivadaResponsavelModel)
            .createQueryBuilder('responsavel')
            .where('responsavel.tenantId = :tenantId', { tenantId })
            .andWhere('responsavel.obraPrivadaId = :obraPrivadaId', {
              obraPrivadaId,
            })
            .andWhere('responsavel.papel = :papel', { papel })
            .andWhere('responsavel.dataBaixa IS NULL')
            .andWhere(
              excludedId ? 'responsavel.id != :excludedId' : '1 = 1',
              excludedId ? { excludedId } : {},
            )
            .getExists(),
      );
      return right(exists);
    } catch (cause) {
      return left(
        new ObraPrivadaResponsavelRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async update(
    id: string,
    props: ObraPrivadaResponsavelUpdate,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity | null> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      const model = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          const repository = manager.getRepository(ObraPrivadaResponsavelModel);
          const current = await repository.findOne({
            where: { id, tenantId },
          });
          if (!current) return null;
          const mutableProps = Object.fromEntries(
            Object.entries(props).filter(
              ([key, value]) =>
                value !== undefined &&
                ![
                  'id',
                  'tenantId',
                  'obraPrivadaId',
                  'createdAt',
                  'updatedAt',
                ].includes(key),
            ),
          ) as Partial<ObraPrivadaResponsavelModel>;
          repository.merge(current, mutableProps);
          return repository.save(current);
        },
      );
      return right(model ? ObraPrivadaResponsavelMapper.toEntity(model) : null);
    } catch (cause) {
      const isConflict = this.isUniqueViolation(cause);
      return left(
        new ObraPrivadaResponsavelRepositoryException({
          code: isConflict
            ? ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT
            : ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
          statusCode: isConflict ? 409 : 500,
          cause,
        }),
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    const cause = error as Record<string, unknown>;
    const driverError =
      (cause?.driverError as Record<string, unknown>) ?? cause;
    return (
      (driverError?.code ?? cause?.code) === '23505' &&
      String(driverError?.constraint ?? cause?.constraint ?? '').includes(
        'obra_privada_responsavel_vigente_papel',
      )
    );
  }

  async delete(id: string): AsyncResult<AppException, Unit> {
    try {
      const tenantId = this.tenantContext.require().tenantId;
      await withTenantManager(this.dataSource, this.tenantContext, (manager) =>
        manager.getRepository(ObraPrivadaResponsavelModel).delete({
          id,
          tenantId,
        }),
      );
      return right(unit);
    } catch (cause) {
      return left(
        new ObraPrivadaResponsavelRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

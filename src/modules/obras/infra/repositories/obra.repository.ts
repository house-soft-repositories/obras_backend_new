import { randomUUID } from 'node:crypto';
import { DataSource, ILike, IsNull } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import { withManager } from '@/core/multitenancy/tenant_manager';
import IObraRepository, {
  ObraFindPageParams,
} from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraMapper from '@/modules/obras/infra/mapper/obra.mapper';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { ObraResponsavelModel } from '@/modules/obras/infra/models/obra_items.model';
import { ObraOrcamentoPrevistoModel } from '@/modules/obras/infra/models/guias.model';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import type ObraDetailReadModel from '@/modules/obras/domain/read-models/obra_detail.read-model';
import { ObraResponsavelTipo } from '@/modules/obras/domain/enums/obra_responsavel_tipo.enum';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';

export default class ObraRepository implements IObraRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  private failure(cause: unknown): ObraRepositoryException {
    return new ObraRepositoryException({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }

  async save(entity: ObraEntity): AsyncResult<AppException, ObraEntity> {
    try {
      const saved = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          const repository = manager.getRepository(ObraModel);
          return repository.save(repository.create(ObraMapper.toModel(entity)));
        },
      );
      return right(ObraMapper.toEntity(saved));
    } catch (cause) {
      const databaseError = cause as { code?: string };
      if (databaseError.code === '23505')
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,
            statusCode: 409,
            cause,
          }),
        );
      return left(this.failure(cause));
    }
  }

  async duplicate(
    entity: ObraEntity,
    sourceObraId: string,
  ): AsyncResult<AppException, ObraEntity> {
    try {
      const duplicated = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          const obraRepository = manager.getRepository(ObraModel);
          await obraRepository.save(
            obraRepository.create(ObraMapper.toModel(entity)),
          );

          const sourceBudgets = await manager
            .getRepository(ObraOrcamentoPrevistoModel)
            .find({ where: { obraId: sourceObraId } });
          if (sourceBudgets.length) {
            await manager.getRepository(ObraOrcamentoPrevistoModel).save(
              sourceBudgets.map((budget) =>
                manager.getRepository(ObraOrcamentoPrevistoModel).create({
                  id: randomUUID(),
                  tenantId: budget.tenantId,
                  obraId: entity.id,
                  fonteId: budget.fonteId,
                  valor: budget.valor,
                }),
              ),
            );
          }

          const sourceResponsaveis = await manager
            .getRepository(ObraResponsavelModel)
            .find({ where: { obraId: sourceObraId } });
          if (sourceResponsaveis.length) {
            await manager.getRepository(ObraResponsavelModel).save(
              sourceResponsaveis.map((responsavel) =>
                manager.getRepository(ObraResponsavelModel).create({
                  id: randomUUID(),
                  tenantId: responsavel.tenantId,
                  obraId: entity.id,
                  usuarioId: responsavel.usuarioId,
                  tipo: responsavel.tipo,
                  createdAt: new Date(),
                }),
              ),
            );
          }

          return obraRepository.findOneOrFail({ where: { id: entity.id } });
        },
      );
      return right(ObraMapper.toEntity(duplicated));
    } catch (cause) {
      const databaseError = cause as { code?: string };
      if (databaseError.code === '23505')
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,
            statusCode: 409,
            cause,
          }),
        );
      return left(this.failure(cause));
    }
  }

  async findLastCodigo(year: number): AsyncResult<AppException, string | null> {
    try {
      const result = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) =>
          manager.getRepository(ObraModel).findOne({
            where: { codigo: ILike(`OBR-${year}-%`) },
            order: { codigo: 'DESC' },
          }),
      );
      return right(result?.codigo ?? null);
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async findById(id: string): AsyncResult<AppException, ObraEntity | null> {
    try {
      const model = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) =>
          manager
            .getRepository(ObraModel)
            .findOne({ where: { id, deletedAt: IsNull() } }),
      );
      return right(model ? ObraMapper.toEntity(model) : null);
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async findOneWithRelations(
    id: string,
  ): AsyncResult<AppException, ObraDetailReadModel | null> {
    try {
      const model = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) =>
          manager.getRepository(ObraModel).findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
              orgao: true,
              setor: true,
              localidade: true,
              classificacao: true,
              subclassificacao: true,
              eixo: true,
              tipologia: true,
              subtipologia: true,
            },
          }),
      );
      if (!model) return right(null);
      const tenantId = this.tenantContext.require().tenantId;
      const responsavel = await withManager(
        this.dataSource,
        this.tenantContext,
        (manager) =>
          manager.getRepository(ObraResponsavelModel).findOne({
            where: {
              obraId: id,
              tenantId,
              tipo: ObraResponsavelTipo.RESPONSAVEL,
              usuario: { tenantId },
            },
            relations: { usuario: true },
          }),
      );
      return right({
        obra: ObraMapper.toEntity(model),
        responsavel: responsavel?.usuario
          ? {
              id: responsavel.usuario.id,
              name: responsavel.usuario.name,
              email: responsavel.usuario.email,
              role: responsavel.usuario.role,
            }
          : null,
      });
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async findPage(
    params: ObraFindPageParams,
  ): AsyncResult<AppException, PageEntity<ObraEntity>> {
    try {
      const result = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          const repository = manager.getRepository(ObraModel);
          const query = repository
            .createQueryBuilder('obra')
            .where('obra.deleted_at IS NULL');
          if (params.status)
            query.andWhere('obra.status = :status', { status: params.status });
          if (params.tipo)
            query.andWhere('obra.tipo = :tipo', { tipo: params.tipo });
          if (params.orgaoId)
            query.andWhere('obra.orgao_id = :orgaoId', {
              orgaoId: params.orgaoId,
            });
          if (params.q)
            query.andWhere(
              '(obra.nome ILIKE :search OR obra.codigo ILIKE :search)',
              { search: `%${params.q}%` },
            );
          const [models, itemCount] = await query
            .orderBy('obra.created_at', 'DESC')
            .take(params.pageOptions.take)
            .skip(params.pageOptions.skip)
            .getManyAndCount();
          return { models, itemCount };
        },
      );
      return right(
        new PageEntity(
          result.models.map((model) => ObraMapper.toEntity(model)),
          new PageMetaEntity({
            pageOptions: params.pageOptions,
            itemCount: result.itemCount,
          }),
        ),
      );
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async updatePartial(
    entity: ObraEntity,
  ): AsyncResult<AppException, ObraEntity> {
    try {
      const model = await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          const repository = manager.getRepository(ObraModel);
          const existing = await repository.findOne({
            where: { id: entity.id, deletedAt: IsNull() },
          });
          if (!existing) return null;
          return repository.save(
            repository.merge(existing, ObraMapper.toModel(entity)),
          );
        },
      );
      if (!model)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(ObraMapper.toEntity(model));
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async softDelete(id: string): AsyncResult<AppException, Unit> {
    try {
      await withManager(
        this.dataSource,
        this.tenantContext,
        async (manager) => {
          await manager
            .getRepository(ObraModel)
            .update(
              { id, deletedAt: IsNull() },
              { deletedAt: new Date(), updatedAt: new Date() },
            );
        },
      );
      return right(unit);
    } catch (cause) {
      return left(this.failure(cause));
    }
  }
}

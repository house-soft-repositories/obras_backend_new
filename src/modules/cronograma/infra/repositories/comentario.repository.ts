import { DataSource, FindOptionsWhere } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IComentarioRepository from '@/modules/cronograma/adapters/comentario_repository.interface';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import EstagioComentarioMapper from '@/modules/cronograma/infra/mapper/estagio_comentario.mapper';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import EstagioComentarioModel from '@/modules/cronograma/infra/models/estagio_comentario.model';
import { withManager } from '@/core/multitenancy/tenant_manager';

export default class ComentarioRepository implements IComentarioRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async save(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioComentarioModel);
        const model = EstagioComentarioMapper.toModel(item);
        const saved = await repo.save(model);
        return right(EstagioComentarioMapper.toEntity(saved));
      });
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async findById(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioComentarioModel);
        const model = await repo.findOne({
          where: { id, obraId, estagioId },
        });
        if (!model)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        return right(EstagioComentarioMapper.toEntity(model));
      });
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async list(
    obraId: string,
    estagioId: string,
  ): AsyncResult<AppException, EstagioComentarioEntity[]> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioComentarioModel);
        const rows = await repo.find({
          where: {
            obraId,
            estagioId,
          } as FindOptionsWhere<EstagioComentarioModel>,
          order: { createdAt: 'ASC' },
        });
        return right(rows.map((row) => EstagioComentarioMapper.toEntity(row)));
      });
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async update(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioComentarioModel);
        const model = EstagioComentarioMapper.toModel(item);
        const saved = await repo.save(model);
        return right(EstagioComentarioMapper.toEntity(saved));
      });
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async remove(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, Unit> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioComentarioModel);
        const result = await repo.delete({
          id,
          obraId,
          estagioId,
        });
        if (result.affected === 0)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        return right(unit);
      });
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import { withManager } from '@/core/multitenancy/tenant_manager';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IAcompanhamentoRepository from '@/modules/cronograma/adapters/acompanhamento_repository.interface';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import EstagioAcompanhamentoMapper from '@/modules/cronograma/infra/mapper/estagio_acompanhamento.mapper';
import EstagioAcompanhamentoModel from '@/modules/cronograma/infra/models/estagio_acompanhamento.model';
import { DataSource } from 'typeorm';

export default class AcompanhamentoRepository implements IAcompanhamentoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async save(
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioAcompanhamentoModel);
        const model = EstagioAcompanhamentoMapper.toModel(
          item,
        );
        const saved = await repo.save(model);
        return right(EstagioAcompanhamentoMapper.toEntity(saved));
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
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioAcompanhamentoModel);
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
        return right(EstagioAcompanhamentoMapper.toEntity(model));
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
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity[]> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioAcompanhamentoModel);
        const rows = await repo.find({
          where: { obraId, estagioId },
          order: { data: 'ASC', createdAt: 'ASC' },
        });
        return right(rows.map((e) => EstagioAcompanhamentoMapper.toEntity(e)));
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
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioAcompanhamentoModel);
        const model = EstagioAcompanhamentoMapper.toModel(
          item,
        );
        const saved = await repo.save(model);
        return right(EstagioAcompanhamentoMapper.toEntity(saved));
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
        const repo = manager.getRepository(EstagioAcompanhamentoModel);
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

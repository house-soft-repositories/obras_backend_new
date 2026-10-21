import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import { withManager } from '@/core/multitenancy/tenant_manager';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import EstagioMapper from '@/modules/cronograma/infra/mapper/estagio.mapper';
import EstagioModel from '@/modules/cronograma/infra/models/estagio.model';
import { EstagioStatus } from '@/modules/cronograma/domain/enums/cronograma.enums';
import DataAgregadasReadModel from '@/modules/cronograma/domain/read_models/data_agregadas.read_model';
import NextPosicaoReadModel from '@/modules/cronograma/domain/read_models/next_posicao.read_model';
import { DataSource, IsNull, Not } from 'typeorm';

export default class EstagioRepository implements IEstagioRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async save(e: EstagioEntity): AsyncResult<AppException, EstagioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const model = EstagioMapper.toModel(e);
        const saved = await repo.save(model);
        return right(EstagioMapper.toEntity(saved));
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

  async saveMany(
    items: EstagioEntity[],
  ): AsyncResult<AppException, EstagioEntity[]> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const models = items.map((item) => EstagioMapper.toModel(item));
        const saved = await repo.save(models);
        return right(saved.map((e) => EstagioMapper.toEntity(e)));
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
    id: string,
    obraId: string,
  ): AsyncResult<AppException, EstagioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const model = await repo.findOne({
          where: { id, obraId },
        });
        if (!model)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        return right(EstagioMapper.toEntity(model));
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
    o: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EstagioEntity>> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const [rows, count] = await repo.findAndCount({
          where: { obraId },
          order: { posicao: 'ASC', id: 'ASC' },
          take: o.take,
          skip: (o.page - 1) * o.take,
        });
        return right(
          new PageEntity(
            rows.map((e) => EstagioMapper.toEntity(e)),
            new PageMetaEntity({ pageOptions: o, itemCount: count }),
          ),
        );
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

  async listRootEstagios(
    obraId: string,
  ): AsyncResult<AppException, EstagioEntity[]> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const rows = await repo.find({
          where: {
            obraId,
            estagioPaiId: IsNull(),
          },
          order: { posicao: 'ASC', id: 'ASC' },
        });
        return right(rows.map((e) => EstagioMapper.toEntity(e)));
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

  async update(e: EstagioEntity): AsyncResult<AppException, EstagioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const model = EstagioMapper.toModel(e);
        const saved = await repo.save(model);
        return right(EstagioMapper.toEntity(saved));
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

  async remove(id: string, obraId: string): AsyncResult<AppException, Unit> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const exists = await repo.findOne({ where: { id, obraId } });
        if (!exists) {
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        }
        await repo.update(
          { obraId, estagioPaiId: id },
          { estagioPaiId: null, updatedAt: new Date() },
        );
        const result = await repo.delete({ id, obraId });
        if (result.affected === 0) {
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        }
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

  async reorder(
    obraId: string,
    items: { id: string; posicao: number }[],
  ): AsyncResult<AppException, Unit> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        for (const item of items) {
          const exists = await repo.findOne({ where: { id: item.id, obraId } });
          if (!exists) {
            return left(
              new CronogramaRepositoryException({
                code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
                statusCode: 404,
              }),
            );
          }
        }
        for (const item of items) {
          const result = await repo.update(
            { id: item.id, obraId },
            { posicao: item.posicao, updatedAt: new Date() },
          );
          if (result.affected === 0) {
            return left(
              new CronogramaRepositoryException({
                code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
                statusCode: 404,
              }),
            );
          }
        }
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

  async updatePercentualDireto(
    obraId: string,
    id: string,
    percentual: number,
  ): AsyncResult<AppException, EstagioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const result = await repo.update(
          { id, obraId },
          { percentualDireto: percentual, updatedAt: new Date() },
        );
        if (result.affected === 0)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        const model = await repo.findOne({
          where: { id, obraId },
        });
        if (!model)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        return right(EstagioMapper.toEntity(model));
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

  async datasAgregadas(
    obraId: string,
  ): AsyncResult<AppException, DataAgregadasReadModel> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const qb = repo.createQueryBuilder('estagio');
        qb.where('estagio.obraId = :obraId', { obraId });
        qb.select('MIN(estagio.dataInicio)', 'dataInicio');
        qb.addSelect('MAX(estagio.dataFim)', 'dataFim');
        const result = await qb.getRawOne<DataAgregadasReadModel>();
        return right({
          dataInicio: result?.dataInicio ?? null,
          dataFim: result?.dataFim ?? null,
        });
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

  async nextPosicao(obraId: string): AsyncResult<AppException, number> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const qb = repo.createQueryBuilder('estagio');
        qb.where('estagio.obraId = :obraId', { obraId });
        qb.select('COALESCE(MAX(estagio.posicao), -1) + 1', 'nextPosicao');
        const result = await qb.getRawOne<NextPosicaoReadModel>();
        return right(Number(result?.nextPosicao ?? 0));
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

  async atual(obraId: string): AsyncResult<AppException, EstagioEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const model = await repo.findOne({
          where: {
            obraId,
            ativo: true,
            status: Not(EstagioStatus.CONCLUIDO),
          },
          order: { posicao: 'ASC', id: 'ASC' },
        });
        if (!model)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        return right(EstagioMapper.toEntity(model));
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

  async hasChildren(
    obraId: string,
    estagioId: string,
  ): AsyncResult<AppException, boolean> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(EstagioModel);
        const count = await repo.count({
          where: { obraId, estagioPaiId: estagioId },
        });
        return right(count > 0);
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

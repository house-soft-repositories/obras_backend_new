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
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import MedicaoMapper from '@/modules/cronograma/infra/mapper/medicao.mapper';
import MedicaoFonteMapper from '@/modules/cronograma/infra/mapper/medicao_fonte.mapper';
import MedicaoModel from '@/modules/cronograma/infra/models/medicao.model';
import MedicaoFonteModel from '@/modules/cronograma/infra/models/medicao_fonte.model';
import { DataSource, FindOptionsWhere } from 'typeorm';

export default class MedicaoRepository implements IMedicaoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async save(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const medicaoRepo = manager.getRepository(MedicaoModel);
        const fonteRepo = manager.getRepository(MedicaoFonteModel);

        const medicaoModel = MedicaoMapper.toModel(item);
        const savedMedicao = await medicaoRepo.save(medicaoModel);

        const fonteModels = item.itens.map(
          (fonte) => MedicaoFonteMapper.toModel(fonte),
        );
        await fonteRepo.save(fonteModels);

        const savedFontes = await fonteRepo.find({
          where: {
            medicaoId: savedMedicao.id,
          } as FindOptionsWhere<MedicaoFonteModel>,
        });

        return right(MedicaoMapper.toEntity(savedMedicao, savedFontes));
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
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const medicaoRepo = manager.getRepository(MedicaoModel);
        const fonteRepo = manager.getRepository(MedicaoFonteModel);

        const [rows, count] = await medicaoRepo.findAndCount({
          where: { obraId },
          order: { data: 'DESC', numero: 'DESC' },
          take: o.take,
          skip: (o.page - 1) * o.take,
        });

        const items = await Promise.all(
          rows.map(async (row) => {
            const fontes = await fonteRepo.find({
              where: {
                medicaoId: row.id,
              } as FindOptionsWhere<MedicaoFonteModel>,
            });
            return MedicaoMapper.toEntity(row, fontes);
          }),
        );

        return right(
          new PageEntity(
            items,
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

  async findById(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, MedicaoEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const medicaoRepo = manager.getRepository(MedicaoModel);
        const fonteRepo = manager.getRepository(MedicaoFonteModel);

        const model = await medicaoRepo.findOne({
          where: { id, obraId },
        });
        if (!model)
          return left(
            new CronogramaRepositoryException({
              code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
              statusCode: 404,
            }),
          );

        const fontes = await fonteRepo.find({
          where: { medicaoId: model.id } as FindOptionsWhere<MedicaoFonteModel>,
        });

        return right(MedicaoMapper.toEntity(model, fontes));
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

  async update(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const medicaoRepo = manager.getRepository(MedicaoModel);
        const fonteRepo = manager.getRepository(MedicaoFonteModel);

        const medicaoModel = MedicaoMapper.toModel(item);
        const savedMedicao = await medicaoRepo.save(medicaoModel);

        await fonteRepo.delete({
          medicaoId: savedMedicao.id,
        });

        const fonteModels = item.itens.map(
          (fonte) => MedicaoFonteMapper.toModel(fonte),
        );
        await fonteRepo.save(fonteModels);

        const savedFontes = await fonteRepo.find({
          where: {
            medicaoId: savedMedicao.id,
          },
        });

        return right(MedicaoMapper.toEntity(savedMedicao, savedFontes));
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

  async remove(obraId: string, id: string): AsyncResult<AppException, Unit> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const medicaoRepo = manager.getRepository(MedicaoModel);
        const result = await medicaoRepo.delete({
          id,
          obraId,
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

  async nextMedicaoNumero(obraId: string): AsyncResult<AppException, number> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(MedicaoModel);
        const qb = repo.createQueryBuilder('medicao');
        qb.where('medicao.obraId = :obraId', { obraId });
        qb.select('COALESCE(MAX(medicao.numero), 0) + 1', 'numero');
        const result = await qb.getRawOne<{ numero?: string | number | null }>();
        return right(Number(result?.numero ?? 1));
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

  async existsNormalNumero(
    obraId: string,
    numero: number,
    ignoreId?: string,
  ): AsyncResult<AppException, boolean> {
    try {
      return await withManager(this.ds, this.tc, async (manager) => {
        const repo = manager.getRepository(MedicaoModel);
        const qb = repo.createQueryBuilder('medicao');
        qb.where('medicao.obraId = :obraId', { obraId });
        qb.andWhere('medicao.numero = :numero', { numero });
        qb.andWhere('medicao.tipo = :tipo', { tipo: 'NORMAL' });
        if (ignoreId) {
          qb.andWhere('medicao.id != :ignoreId', { ignoreId });
        }
        const count = await qb.getCount();
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

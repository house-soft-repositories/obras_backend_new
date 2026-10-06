import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import MedicaoMapper, {
  MedicaoFonteRow,
  MedicaoRow,
} from '@/modules/cronograma/infra/mapper/medicao.mapper';

type CountRow = { count: number };
type ExistsRow = { exists: number };
type DeleteRow = { deleted: number };

export default class MedicaoRepository implements IMedicaoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private schema() {
    return this.tc.require().schemaName;
  }

  async save(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity> {
    try {
      const s = this.schema();
      const q = this.ds.createQueryRunner();
      await q.connect();
      await q.startTransaction();
      try {
        const medicaoRows = (await q.query(
          `INSERT INTO "${s}"."medicao" (id,tenant_id,obra_id,orgao_id,numero,tipo,data,observacao,criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [
            item.id,
            item.tenantId,
            item.obraId,
            item.orgaoId,
            item.numero,
            item.tipo,
            item.dataMedicao,
            item.observacao,
            item.criadoEm,
          ],
        )) as unknown as MedicaoRow[];
        const row = medicaoRows[0];
        const fontes: MedicaoFonteRow[] = [];
        for (const fonte of item.itens) {
          const fonteRows = (await q.query(
            `INSERT INTO "${s}"."medicao_fonte" (id,tenant_id,medicao_id,fonte_id,valor) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [
              fonte.id,
              fonte.tenantId,
              fonte.medicaoId,
              fonte.fonteId,
              fonte.valor,
            ],
          )) as unknown as MedicaoFonteRow[];
          const fonteRow = fonteRows[0];
          fontes.push(fonteRow);
        }
        await q.commitTransaction();
        return right(MedicaoMapper.toEntity(row, fontes));
      } catch (cause) {
        await q.rollbackTransaction();
        return left(this.failure(cause));
      } finally {
        await q.release();
      }
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async findById(
    id: string,
    obraId: string,
  ): AsyncResult<AppException, MedicaoEntity> {
    try {
      const s = this.schema();
      const [row] = await this.ds.query<MedicaoRow[]>(
        `SELECT * FROM "${s}"."medicao" WHERE id=$1 AND obra_id=$2`,
        [id, obraId],
      );
      if (!row) return left(this.notFound());
      const fontes = await this.ds.query<MedicaoFonteRow[]>(
        `SELECT * FROM "${s}"."medicao_fonte" WHERE medicao_id=$1 ORDER BY id ASC`,
        [id],
      );
      return right(MedicaoMapper.toEntity(row, fontes));
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async list(
    obraId: string,
    o: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>> {
    try {
      const s = this.schema();
      const rows = await this.ds.query<MedicaoRow[]>(
        `SELECT * FROM "${s}"."medicao" WHERE obra_id=$1 ORDER BY data DESC,numero DESC LIMIT $2 OFFSET $3`,
        [obraId, o.take, (o.page - 1) * o.take],
      );
      const [{ count }] = await this.ds.query<CountRow[]>(
        `SELECT COUNT(*)::int AS count FROM "${s}"."medicao" WHERE obra_id=$1`,
        [obraId],
      );
      const items = await Promise.all(
        rows.map(async (row) => {
          const fontes = await this.ds.query<MedicaoFonteRow[]>(
            `SELECT * FROM "${s}"."medicao_fonte" WHERE medicao_id=$1 ORDER BY id ASC`,
            [row.id],
          );
          return MedicaoMapper.toEntity(row, fontes);
        }),
      );
      return right(
        new PageEntity(
          items,
          new PageMetaEntity({ pageOptions: o, itemCount: count }),
        ),
      );
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async update(item: MedicaoEntity): AsyncResult<AppException, MedicaoEntity> {
    try {
      const s = this.schema();
      const q = this.ds.createQueryRunner();
      await q.connect();
      await q.startTransaction();
      try {
        const medicaoRows = (await q.query(
          `UPDATE "${s}"."medicao" SET numero=$3,orgao_id=$4,tipo=$5,data=$6,observacao=$7 WHERE id=$1 AND obra_id=$2 RETURNING *`,
          [
            item.id,
            item.obraId,
            item.numero,
            item.orgaoId,
            item.tipo,
            item.dataMedicao,
            item.observacao,
          ],
        )) as unknown as MedicaoRow[];
        const row = medicaoRows[0];
        if (!row) {
          await q.rollbackTransaction();
          return left(this.notFound());
        }
        await q.query(
          `DELETE FROM "${s}"."medicao_fonte" WHERE medicao_id=$1`,
          [item.id],
        );
        const fontes: MedicaoFonteRow[] = [];
        for (const fonte of item.itens) {
          const fonteRows = (await q.query(
            `INSERT INTO "${s}"."medicao_fonte" (id,tenant_id,medicao_id,fonte_id,valor) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [
              fonte.id,
              fonte.tenantId,
              fonte.medicaoId,
              fonte.fonteId,
              fonte.valor,
            ],
          )) as unknown as MedicaoFonteRow[];
          const fonteRow = fonteRows[0];
          fontes.push(fonteRow);
        }
        await q.commitTransaction();
        return right(MedicaoMapper.toEntity(row, fontes));
      } catch (cause) {
        await q.rollbackTransaction();
        return left(this.failure(cause));
      } finally {
        await q.release();
      }
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async remove(id: string, obraId: string): AsyncResult<AppException, void> {
    try {
      const rows = await this.ds.query<DeleteRow[]>(
        `DELETE FROM "${this.schema()}"."medicao" WHERE id=$1 AND obra_id=$2 RETURNING 1 AS deleted`,
        [id, obraId],
      );
      if (rows.length === 0) return left(this.notFound());
      return right(undefined);
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async nextNumero(obraId: string): AsyncResult<AppException, number> {
    try {
      const [row] = await this.ds.query<{ numero: number | string }[]>(
        `SELECT COALESCE(MAX(numero),0)+1 AS numero FROM "${this.schema()}"."medicao" WHERE obra_id=$1`,
        [obraId],
      );
      return right(Number(row.numero));
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  async existsNormalNumero(
    obraId: string,
    numero: number,
    ignoreId?: string,
  ): AsyncResult<AppException, boolean> {
    try {
      const params = [obraId, numero] as unknown[];
      let ignore = '';
      if (ignoreId) {
        params.push(ignoreId);
        ignore = ' AND id <> $3';
      }
      const [row] = await this.ds.query<ExistsRow[]>(
        `SELECT 1 AS exists FROM "${this.schema()}"."medicao" WHERE obra_id=$1 AND numero=$2 AND tipo='NORMAL'${ignore} LIMIT 1`,
        params,
      );
      return right(Boolean(row));
    } catch (cause) {
      return left(this.failure(cause));
    }
  }

  private notFound() {
    return new CronogramaRepositoryException({
      code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
      statusCode: 404,
    });
  }

  private failure(cause: unknown) {
    return new CronogramaRepositoryException({
      code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
      cause,
    });
  }
}

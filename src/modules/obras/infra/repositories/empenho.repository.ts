import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { Either, left, right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import EmpenhoMapper from '@/modules/obras/infra/mapper/empenho.mapper';

const SELECT = `id, tenant_id AS "tenantId", obra_id AS "obraId", fonte_id AS "fonteId", tipo, numero, data_empenho AS "dataEmpenho", valor, observacoes, created_at AS "createdAt", updated_at AS "updatedAt"`;

export default class EmpenhoRepository implements IEmpenhoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private fail<R>(cause: unknown): Either<AppException, R> {
    return left<AppException, R>(
      new ObraRepositoryException({
        code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED,
        statusCode: 500,
        cause,
      }),
    );
  }

  async save(entity: EmpenhoEntity): AsyncResult<AppException, EmpenhoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."empenho" (id, tenant_id, obra_id, fonte_id, tipo, numero, data_empenho, valor, observacoes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET fonte_id=EXCLUDED.fonte_id, tipo=EXCLUDED.tipo, numero=EXCLUDED.numero, data_empenho=EXCLUDED.data_empenho, valor=EXCLUDED.valor, observacoes=EXCLUDED.observacoes, updated_at=EXCLUDED.updated_at
         RETURNING ${SELECT}`,
        [o.id, o.tenantId, o.obraId, o.fonteId, o.tipo, o.numero, o.dataEmpenho, o.valor.toFixed(2), o.observacoes, o.createdAt, o.updatedAt],
      );
      return right(EmpenhoMapper.toEntity(saved));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async findById(id: string): AsyncResult<AppException, EmpenhoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT ${SELECT} FROM "${s}"."empenho" WHERE id=$1`,
        [id],
      );
      return right(row ? EmpenhoMapper.toEntity(row) : null);
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async listByObra(obraId: string): AsyncResult<AppException, EmpenhoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT ${SELECT} FROM "${s}"."empenho" WHERE obra_id=$1 ORDER BY created_at ASC`,
        [obraId],
      );
      return right(rows.map((r) => EmpenhoMapper.toEntity(r)));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async sumLiquidado(empenhoId: string, ignoreId?: string): AsyncResult<AppException, number> {
    try {
      const s = this.tc.require().schemaName;
      const params: unknown[] = [empenhoId];
      const ignore = ignoreId ? `AND id <> $2` : '';
      if (ignoreId) params.push(ignoreId);
      const [row] = await this.ds.query<{ sum: string }[]>(
        `SELECT COALESCE(SUM(valor), 0) AS sum FROM "${s}"."liquidacao" WHERE empenho_id=$1 ${ignore}`,
        params,
      );
      return right(Number(row?.sum ?? 0));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async delete(id: string): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      await this.ds.query(`DELETE FROM "${s}"."empenho" WHERE id=$1`, [id]);
      return right(undefined);
    } catch (cause) {
      return this.fail(cause);
    }
  }
}

import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { Either, left, right } from '@/core/types/either';
import ILiquidacaoRepository from '@/modules/obras/adapters/liquidacao_repository.interface';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import LiquidacaoMapper from '@/modules/obras/infra/mapper/liquidacao.mapper';

const SELECT = `l.id, l.tenant_id AS "tenantId", l.empenho_id AS "empenhoId", l.fonte_id AS "fonteId", l.numero, l.data_liquidacao AS "dataLiquidacao", l.valor, l.observacoes, l.created_at AS "createdAt", l.updated_at AS "updatedAt"`;

export default class LiquidacaoRepository implements ILiquidacaoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private fail<R>(cause: unknown): Either<AppException, R> {
    return left<AppException, R>(
      new ObraRepositoryException({
        code: ErrorCodeConstants.LIQUIDACAO_REPOSITORY_FAILED,
        statusCode: 500,
        cause,
      }),
    );
  }

  async save(entity: LiquidacaoEntity): AsyncResult<AppException, LiquidacaoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."liquidacao" (id, tenant_id, empenho_id, fonte_id, numero, data_liquidacao, valor, observacoes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET fonte_id=EXCLUDED.fonte_id, numero=EXCLUDED.numero, data_liquidacao=EXCLUDED.data_liquidacao, valor=EXCLUDED.valor, observacoes=EXCLUDED.observacoes, updated_at=EXCLUDED.updated_at
         RETURNING ${SELECT.replaceAll('l.', '')}`,
        [o.id, o.tenantId, o.empenhoId, o.fonteId, o.numero, o.dataLiquidacao, o.valor.toFixed(2), o.observacoes, o.createdAt, o.updatedAt],
      );
      return right(LiquidacaoMapper.toEntity(saved));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async findById(id: string): AsyncResult<AppException, LiquidacaoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT ${SELECT} FROM "${s}"."liquidacao" l WHERE l.id=$1`,
        [id],
      );
      return right(row ? LiquidacaoMapper.toEntity(row) : null);
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async listByObra(obraId: string): AsyncResult<AppException, LiquidacaoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT ${SELECT} FROM "${s}"."liquidacao" l
         JOIN "${s}"."empenho" e ON e.id = l.empenho_id
         WHERE e.obra_id=$1 ORDER BY l.created_at ASC`,
        [obraId],
      );
      return right(rows.map((r) => LiquidacaoMapper.toEntity(r)));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async sumPago(liquidacaoId: string, ignoreId?: string): AsyncResult<AppException, number> {
    try {
      const s = this.tc.require().schemaName;
      const params: unknown[] = [liquidacaoId];
      const ignore = ignoreId ? `AND id <> $2` : '';
      if (ignoreId) params.push(ignoreId);
      const [row] = await this.ds.query<{ sum: string }[]>(
        `SELECT COALESCE(SUM(valor), 0) AS sum FROM "${s}"."pagamento" WHERE liquidacao_id=$1 ${ignore}`,
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
      await this.ds.query(`DELETE FROM "${s}"."liquidacao" WHERE id=$1`, [id]);
      return right(undefined);
    } catch (cause) {
      return this.fail(cause);
    }
  }
}

import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { Either, left, right } from '@/core/types/either';
import IPagamentoRepository from '@/modules/obras/adapters/pagamento_repository.interface';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import PagamentoMapper from '@/modules/obras/infra/mapper/pagamento.mapper';

const SELECT = `p.id, p.tenant_id AS "tenantId", p.empenho_id AS "empenhoId", p.liquidacao_id AS "liquidacaoId", p.fonte_id AS "fonteId", p.numero_ordem_bancaria AS "numeroOrdemBancaria", p.data_ordem_bancaria AS "dataOrdemBancaria", p.valor, p.observacoes, p.created_at AS "createdAt", p.updated_at AS "updatedAt"`;

export default class PagamentoRepository implements IPagamentoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private fail<R>(cause: unknown): Either<AppException, R> {
    return left<AppException, R>(
      new ObraRepositoryException({
        code: ErrorCodeConstants.PAGAMENTO_REPOSITORY_FAILED,
        statusCode: 500,
        cause,
      }),
    );
  }

  async save(entity: PagamentoEntity): AsyncResult<AppException, PagamentoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."pagamento" (id, tenant_id, empenho_id, liquidacao_id, fonte_id, numero_ordem_bancaria, data_ordem_bancaria, valor, observacoes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET fonte_id=EXCLUDED.fonte_id, numero_ordem_bancaria=EXCLUDED.numero_ordem_bancaria, data_ordem_bancaria=EXCLUDED.data_ordem_bancaria, valor=EXCLUDED.valor, observacoes=EXCLUDED.observacoes, updated_at=EXCLUDED.updated_at
         RETURNING ${SELECT.replaceAll('p.', '')}`,
        [o.id, o.tenantId, o.empenhoId, o.liquidacaoId, o.fonteId, o.numeroOrdemBancaria, o.dataOrdemBancaria, o.valor.toFixed(2), o.observacoes, o.createdAt, o.updatedAt],
      );
      return right(PagamentoMapper.toEntity(saved));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async findById(id: string): AsyncResult<AppException, PagamentoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT ${SELECT} FROM "${s}"."pagamento" p WHERE p.id=$1`,
        [id],
      );
      return right(row ? PagamentoMapper.toEntity(row) : null);
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async listByObra(obraId: string): AsyncResult<AppException, PagamentoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT ${SELECT} FROM "${s}"."pagamento" p
         JOIN "${s}"."empenho" e ON e.id = p.empenho_id
         WHERE e.obra_id=$1 ORDER BY p.created_at ASC`,
        [obraId],
      );
      return right(rows.map((r) => PagamentoMapper.toEntity(r)));
    } catch (cause) {
      return this.fail(cause);
    }
  }

  async delete(id: string): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      await this.ds.query(`DELETE FROM "${s}"."pagamento" WHERE id=$1`, [id]);
      return right(undefined);
    } catch (cause) {
      return this.fail(cause);
    }
  }
}

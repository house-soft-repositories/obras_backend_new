import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObservacaoRepository from '@/modules/obras/adapters/observacao_repository.interface';
import ObservacaoEntity from '@/modules/obras/domain/entities/observacao.entity';
import ObservacaoMapper from '@/modules/obras/infra/mapper/observacao.mapper';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class ObservacaoRepository implements IObservacaoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async save(entity: ObservacaoEntity): AsyncResult<AppException, ObservacaoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."observacao" (id, tenant_id, obra_id, texto, autor_usuario_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET texto=EXCLUDED.texto, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id AS "tenantId", obra_id AS "obraId", texto, autor_usuario_id AS "autorUsuarioId", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [o.id, o.tenantId, o.obraId, o.texto, o.autorUsuarioId, o.createdAt, o.updatedAt],
      );
      return right(ObservacaoMapper.toEntity(saved as unknown as never));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBSERVACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, ObservacaoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", texto, autor_usuario_id AS "autorUsuarioId", created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."observacao" WHERE id=$1`,
        [id],
      );
      return right(row ? ObservacaoMapper.toEntity(row as unknown as never) : null);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBSERVACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listByObra(obraId: string): AsyncResult<AppException, ObservacaoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", texto, autor_usuario_id AS "autorUsuarioId", created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."observacao" WHERE obra_id=$1 ORDER BY created_at DESC`,
        [obraId],
      );
      return right(rows.map((r) => ObservacaoMapper.toEntity(r as unknown as never)));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBSERVACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async delete(id: string): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      await this.ds.query(`DELETE FROM "${s}"."observacao" WHERE id=$1`, [id]);
      return right(undefined);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBSERVACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

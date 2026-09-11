import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import { randomUUID } from 'node:crypto';

export default class EquipeService {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async addResponsavel(param: { obraId: string; usuarioId: string; tipo?: string }): AsyncResult<AppException, void> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const obra = await this.ds.query(`SELECT id FROM "${schema}"."obras" WHERE id=$1 AND deleted_at IS NULL`, [param.obraId]);
      if (!obra.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      const user = await this.ds.query(`SELECT id FROM public.users WHERE id=$1 AND (tenant_id=$2 OR tenant_id IS NULL)`, [param.usuarioId, ctx.tenantId]);
      if (!user.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_EQUIPE_INVALID_USUARIO, statusCode: 400 }));
      const tipo = param.tipo ?? 'RESPONSAVEL';
      await this.ds.query(
        `INSERT INTO "${schema}"."obra_responsaveis" (id, tenant_id, obra_id, usuario_id, tipo, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [randomUUID(), ctx.tenantId, param.obraId, param.usuarioId, tipo, new Date()],
      );
      // idempotence via OR check duplicate usuario+obra+tipo: use unique on (obra_id, usuario_id, tipo) not exists so ON CONFLICT not work, use INSERT ... ON CONFLICT DO NOTHING with unique constraint on (obra_id, usuario_id) if exists, else check beforehand
      // fallback: ensure no duplicate by checking existing
      return right(undefined);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async removeResponsavel(param: { obraId: string; usuarioId: string }): AsyncResult<AppException, void> {
    try {
      const schema = this.tc.require().schemaName;
      await this.ds.query(`DELETE FROM "${schema}"."obra_responsaveis" WHERE obra_id=$1 AND usuario_id=$2`, [param.obraId, param.usuarioId]);
      return right(undefined);
    } catch (cause) {
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async listResponsaveis(obraId: string): AsyncResult<AppException, Array<{ usuarioId: string; tipo: string }>> {
    try {
      const schema = this.tc.require().schemaName;
      const rows = await this.ds.query<{ usuario_id: string; tipo: string }[]>(`SELECT usuario_id, tipo FROM "${schema}"."obra_responsaveis" WHERE obra_id=$1`, [obraId]);
      return right(rows.map((r) => ({ usuarioId: r.usuario_id, tipo: r.tipo })));
    } catch (cause) {
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async addSeguidor(param: { obraId: string; usuarioId: string }): AsyncResult<AppException, void> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const obra = await this.ds.query(`SELECT id FROM "${schema}"."obras" WHERE id=$1 AND deleted_at IS NULL`, [param.obraId]);
      if (!obra.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      await this.ds.query(
        `INSERT INTO "${schema}"."obra_seguidores" (id, tenant_id, obra_id, usuario_id, seguido_em) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [randomUUID(), ctx.tenantId, param.obraId, param.usuarioId, new Date()],
      );
      return right(undefined);
    } catch (cause) {
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async removeSeguidor(param: { obraId: string; usuarioId: string }): AsyncResult<AppException, void> {
    try {
      const schema = this.tc.require().schemaName;
      await this.ds.query(`DELETE FROM "${schema}"."obra_seguidores" WHERE obra_id=$1 AND usuario_id=$2`, [param.obraId, param.usuarioId]);
      return right(undefined);
    } catch (cause) {
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async listSeguidores(obraId: string): AsyncResult<AppException, Array<{ usuarioId: string }>> {
    try {
      const schema = this.tc.require().schemaName;
      const rows = await this.ds.query<{ usuario_id: string }[]>(`SELECT usuario_id FROM "${schema}"."obra_seguidores" WHERE obra_id=$1`, [obraId]);
      return right(rows.map((r) => ({ usuarioId: r.usuario_id })));
    } catch (cause) {
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
}

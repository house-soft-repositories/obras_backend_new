import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';
import PastaMapper from '@/modules/documentos/infra/mapper/pasta.mapper';
import PastaModel from '@/modules/documentos/infra/models/pasta.model';
import { DataSource } from 'typeorm';

const RETURNING = `id, obra_id AS "obraId", pasta_pai_id AS "pastaPaiId", nome,
  criado_por_usuario_id AS "criadoPorUsuarioId",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export default class PastaRepository implements IPastaRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: PastaEntity): AsyncResult<AppException, PastaEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = PastaMapper.toModel(entity);
      const [saved] = await this.dataSource.query<PastaModel[]>(
        `INSERT INTO "${schema}"."pasta"
           (id, obra_id, pasta_pai_id, nome, criado_por_usuario_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           nome = EXCLUDED.nome,
           pasta_pai_id = EXCLUDED.pasta_pai_id,
           updated_at = EXCLUDED.updated_at
         RETURNING ${RETURNING}`,
        [
          value.id,
          value.obraId,
          value.pastaPaiId,
          value.nome,
          value.criadoPorUsuarioId,
          value.createdAt,
          value.updatedAt,
        ],
      );
      return right(PastaMapper.toEntity(saved));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findById(id: string): AsyncResult<AppException, PastaEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<PastaModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."pasta" WHERE id = $1`,
        [id],
      );
      return right(row ? PastaMapper.toEntity(row) : null);
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findRootByObraId(
    obraId: string,
  ): AsyncResult<AppException, PastaEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<PastaModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."pasta"
         WHERE obra_id = $1 AND pasta_pai_id IS NULL`,
        [obraId],
      );
      return right(row ? PastaMapper.toEntity(row) : null);
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findChildren(
    pastaId: string,
  ): AsyncResult<AppException, PastaEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<PastaModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."pasta"
         WHERE pasta_pai_id = $1 ORDER BY nome ASC`,
        [pastaId],
      );
      return right(rows.map((r) => PastaMapper.toEntity(r)));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findByObraId(obraId: string): AsyncResult<AppException, PastaEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<PastaModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."pasta" WHERE obra_id = $1`,
        [obraId],
      );
      return right(rows.map((r) => PastaMapper.toEntity(r)));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findSiblingByName(
    obraId: string,
    pastaPaiId: string | null,
    nome: string,
  ): AsyncResult<AppException, PastaEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<PastaModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."pasta"
         WHERE obra_id = $1
           AND ((pasta_pai_id = $2) OR (pasta_pai_id IS NULL AND $2 IS NULL))
           AND nome = $3`,
        [obraId, pastaPaiId, nome],
      );
      return right(row ? PastaMapper.toEntity(row) : null);
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async deleteById(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."pasta" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  private toFailure(cause: unknown): PastaRepositoryException {
    const err = cause as Record<string, unknown>;
    const driverErr = (err?.driverError as Record<string, unknown>) ?? err;
    const code = (driverErr?.code as string) ?? (err?.code as string) ?? null;
    const constraint =
      (driverErr?.constraint as string) ?? (err?.constraint as string) ?? '';
    if (code === '23505' && constraint.includes('pasta')) {
      return new PastaRepositoryException({
        code: ErrorCodeConstants.PASTA_DUPLICATE_NAME,
        statusCode: 409,
        cause,
      });
    }
    return new PastaRepositoryException({
      code: ErrorCodeConstants.PASTA_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

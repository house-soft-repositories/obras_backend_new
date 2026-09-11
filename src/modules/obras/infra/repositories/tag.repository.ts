import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ITagRepository from '@/modules/obras/adapters/tag_repository.interface';
import TagEntity from '@/modules/obras/domain/entities/tag.entity';
import { randomUUID } from 'node:crypto';
import TagMapper from '@/modules/obras/infra/mapper/tag.mapper';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class TagRepository implements ITagRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async findByNome(nome: string): AsyncResult<AppException, TagEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const tenantId = this.tc.require().tenantId;
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", nome, created_at AS "createdAt" FROM "${s}"."tag" WHERE tenant_id=$1 AND nome=$2`,
        [tenantId, nome],
      );
      return right(row ? TagMapper.toEntity(row as unknown as never) : null);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.TAG_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, TagEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", nome, created_at AS "createdAt" FROM "${s}"."tag" WHERE id=$1`,
        [id],
      );
      return right(row ? TagMapper.toEntity(row as unknown as never) : null);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.TAG_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async save(entity: TagEntity): AsyncResult<AppException, TagEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."tag" (id, tenant_id, nome, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome RETURNING id, tenant_id AS "tenantId", nome, created_at AS "createdAt"`,
        [o.id, o.tenantId, o.nome, o.createdAt],
      );
      return right(TagMapper.toEntity(saved as unknown as never));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.TAG_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listByObra(obraId: string): AsyncResult<AppException, TagEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT t.id, t.tenant_id AS "tenantId", t.nome, t.created_at AS "createdAt" FROM "${s}"."tag" t INNER JOIN "${s}"."obra_tag" ot ON ot.tag_id=t.id WHERE ot.obra_id=$1`,
        [obraId],
      );
      return right(rows.map((r) => TagMapper.toEntity(r as unknown as never)));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.TAG_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async attach(obraId: string, tagId: string): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      const tenantId = this.tc.require().tenantId;
      await this.ds.query(
        `INSERT INTO "${s}"."obra_tag" (id, tenant_id, obra_id, tag_id, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (obra_id, tag_id) DO NOTHING`,
        [randomUUID(), tenantId, obraId, tagId, new Date()],
      );
      return right(undefined);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_TAG_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async detach(obraId: string, tagId: string): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      await this.ds.query(`DELETE FROM "${s}"."obra_tag" WHERE obra_id=$1 AND tag_id=$2`, [obraId, tagId]);
      return right(undefined);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_TAG_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

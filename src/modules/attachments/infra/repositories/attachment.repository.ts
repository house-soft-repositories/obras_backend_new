import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import AttachmentMapper from '@/modules/attachments/infra/mapper/attachment.mapper';
import AttachmentModel from '@/modules/attachments/infra/models/attachment.model';
import AttachmentRepositoryException from '@/modules/attachments/exceptions/attachment_repository.exception';

const RETURNING = `id, file_url AS "fileUrl", original_name AS "originalName", entity_type AS "entityType",
  entity_id AS "entityId", created_by AS "createdBy", updated_by AS "updatedBy",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export default class AttachmentRepository implements IAttachmentRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: AttachmentEntity,
  ): AsyncResult<AppException, AttachmentEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = AttachmentMapper.toModel(entity);
      const [saved] = await this.dataSource.query<AttachmentModel[]>(
        `INSERT INTO "${schema}"."attachments"
           (id, file_url, original_name, entity_type, entity_id, created_by, updated_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           file_url = EXCLUDED.file_url,
           original_name = EXCLUDED.original_name,
           entity_type = EXCLUDED.entity_type,
           entity_id = EXCLUDED.entity_id,
           updated_by = EXCLUDED.updated_by,
           updated_at = EXCLUDED.updated_at
         RETURNING ${RETURNING}`,
        [
          value.id,
          value.fileUrl,
          value.originalName,
          value.entityType,
          value.entityId,
          value.createdBy,
          value.updatedBy,
          value.createdAt,
          value.updatedAt,
        ],
      );
      return right(AttachmentMapper.toEntity(saved));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async saveMany(
    entities: AttachmentEntity[],
  ): AsyncResult<AppException, AttachmentEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const saved = await this.dataSource.transaction(async (manager) => {
        const rows: AttachmentModel[] = [];
        for (const entity of entities) {
          const value = AttachmentMapper.toModel(entity);
          const [row] = await manager.query<AttachmentModel[]>(
            `INSERT INTO "${schema}"."attachments"
               (id, file_url, original_name, entity_type, entity_id, created_by, updated_by, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING ${RETURNING}`,
            [
              value.id,
              value.fileUrl,
              value.originalName,
              value.entityType,
              value.entityId,
              value.createdBy,
              value.updatedBy,
              value.createdAt,
              value.updatedAt,
            ],
          );
          rows.push(row);
        }
        return rows;
      });
      return right(saved.map((row) => AttachmentMapper.toEntity(row)));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findById(id: string): AsyncResult<AppException, AttachmentEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [found] = await this.dataSource.query<AttachmentModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."attachments" WHERE id = $1`,
        [id],
      );
      if (!found)
        return left(
          new AttachmentRepositoryException({
            code: ErrorCodeConstants.ATTACHMENT_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(AttachmentMapper.toEntity(found));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async deleteById(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."attachments" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  private toFailure(cause: unknown): AttachmentRepositoryException {
    if (cause instanceof AttachmentRepositoryException) return cause;
    return new AttachmentRepositoryException({
      code: ErrorCodeConstants.ATTACHMENT_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

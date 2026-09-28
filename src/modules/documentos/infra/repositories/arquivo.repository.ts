import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import ArquivoRepositoryException from '@/modules/documentos/exceptions/arquivo_repository.exception';
import ArquivoMapper from '@/modules/documentos/infra/mapper/arquivo.mapper';
import ArquivoModel from '@/modules/documentos/infra/models/arquivo.model';
import { DataSource } from 'typeorm';

const RETURNING = `id, obra_id AS "obraId", pasta_id AS "pastaId", nome, descricao,
  nome_original AS "nomeOriginal", mime_type AS "mimeType",
  tamanho_bytes AS "tamanhoBytes", storage_key AS "storageKey",
  attachment_id AS "attachmentId",
  enviado_por_usuario_id AS "enviadoPorUsuarioId",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export default class ArquivoRepository implements IArquivoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: ArquivoEntity): AsyncResult<AppException, ArquivoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = ArquivoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<ArquivoModel[]>(
        `INSERT INTO "${schema}"."arquivo"
           (id, obra_id, pasta_id, nome, descricao, nome_original, mime_type,
            tamanho_bytes, storage_key, attachment_id, enviado_por_usuario_id,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           pasta_id = EXCLUDED.pasta_id,
           nome = EXCLUDED.nome,
           descricao = EXCLUDED.descricao,
           mime_type = EXCLUDED.mime_type,
           tamanho_bytes = EXCLUDED.tamanho_bytes,
           storage_key = EXCLUDED.storage_key,
           attachment_id = EXCLUDED.attachment_id,
           updated_at = EXCLUDED.updated_at
         RETURNING ${RETURNING}`,
        [
          value.id,
          value.obraId,
          value.pastaId,
          value.nome,
          value.descricao,
          value.nomeOriginal,
          value.mimeType,
          value.tamanhoBytes,
          value.storageKey,
          value.attachmentId,
          value.enviadoPorUsuarioId,
          value.createdAt,
          value.updatedAt,
        ],
      );
      return right(ArquivoMapper.toEntity(saved));
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, ArquivoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ArquivoModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."arquivo" WHERE id = $1`,
        [id],
      );
      return right(row ? ArquivoMapper.toEntity(row) : null);
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findByPastaId(
    pastaId: string,
    take: number,
    skip: number,
    order: 'ASC' | 'DESC',
  ): AsyncResult<AppException, ArquivoEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<ArquivoModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."arquivo"
         WHERE pasta_id = $1 ORDER BY created_at ${order} LIMIT $2 OFFSET $3`,
        [pastaId, take, skip],
      );
      return right(rows.map((r) => ArquivoMapper.toEntity(r)));
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async countByPastaId(pastaId: string): AsyncResult<AppException, number> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count FROM "${schema}"."arquivo" WHERE pasta_id = $1`,
        [pastaId],
      );
      return right(Number(row?.count ?? 0));
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findByObraId(
    obraId: string,
  ): AsyncResult<AppException, ArquivoEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<ArquivoModel[]>(
        `SELECT ${RETURNING} FROM "${schema}"."arquivo" WHERE obra_id = $1`,
        [obraId],
      );
      return right(rows.map((r) => ArquivoMapper.toEntity(r)));
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async countByObraId(obraId: string): AsyncResult<AppException, number> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count FROM "${schema}"."arquivo" WHERE obra_id = $1`,
        [obraId],
      );
      return right(Number(row?.count ?? 0));
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async deleteById(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."arquivo" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(
        new ArquivoRepositoryException({
          code: ErrorCodeConstants.ARQUIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { unit, type Unit } from '@/core/types/unit';
import { left, right } from '@/core/types/either';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import { ListArquivosQuery } from '@/modules/obras-privadas/infra/query/list_arquivos.query';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import ObraPrivadaArquivoRepositoryException from '@/modules/obras-privadas/exceptions/obra_privada_arquivo_repository.exception';
import ObraPrivadaArquivoMapper from '@/modules/obras-privadas/infra/mapper/obra_privada_arquivo.mapper';
import ObraPrivadaArquivoModel from '@/modules/obras-privadas/infra/models/obra_privada_arquivo.model';
import { DataSource } from 'typeorm';

const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", vinculo, vinculo_id AS "vinculoId", categoria, nome, descricao, nome_original AS "nomeOriginal", mime_type AS "mimeType", tamanho_bytes AS "tamanhoBytes", storage_key AS "storageKey", ordem, latitude, longitude, capturado_em AS "capturadoEm", enviado_por_usuario_id AS "enviadoPorUsuarioId", created_at AS "createdAt", updated_at AS "updatedAt"`;

export default class ObraPrivadaArquivoRepository implements IObraPrivadaArquivoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: ObraPrivadaArquivoEntity,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = ObraPrivadaArquivoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<ObraPrivadaArquivoModel[]>(
        `INSERT INTO "${schema}"."obra_privada_arquivo" (id, tenant_id, obra_privada_id, vinculo, vinculo_id, categoria, nome, descricao, nome_original, mime_type, tamanho_bytes, storage_key, ordem, latitude, longitude, capturado_em, enviado_por_usuario_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET
           vinculo = EXCLUDED.vinculo,
           vinculo_id = EXCLUDED.vinculo_id,
           categoria = EXCLUDED.categoria,
           nome = EXCLUDED.nome,
           descricao = EXCLUDED.descricao,
           nome_original = EXCLUDED.nome_original,
           mime_type = EXCLUDED.mime_type,
           tamanho_bytes = EXCLUDED.tamanho_bytes,
           storage_key = EXCLUDED.storage_key,
           ordem = EXCLUDED.ordem,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           capturado_em = EXCLUDED.capturado_em,
           enviado_por_usuario_id = EXCLUDED.enviado_por_usuario_id,
           updated_at = EXCLUDED.updated_at
         RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.vinculo,
          model.vinculoId,
          model.categoria,
          model.nome,
          model.descricao,
          model.nomeOriginal,
          model.mimeType,
          model.tamanhoBytes,
          model.storageKey,
          model.ordem,
          model.latitude,
          model.longitude,
          model.capturadoEm,
          model.enviadoPorUsuarioId,
          model.createdAt,
          model.updatedAt,
        ],
      );
      return right(
        ObraPrivadaArquivoMapper.toEntity(saved as ObraPrivadaArquivoModel),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ObraPrivadaArquivoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."obra_privada_arquivo" WHERE id = $1`,
        [id],
      );
      return right(
        row
          ? ObraPrivadaArquivoMapper.toEntity(row as ObraPrivadaArquivoModel)
          : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async list(
    filter: ListArquivosQuery,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const conditions = [`obra_privada_id = $1`];
      const params: unknown[] = [filter.obraPrivadaId];
      if (filter.vinculo) {
        params.push(filter.vinculo);
        conditions.push(`vinculo = $${params.length}`);
      }
      if (filter.vinculoId) {
        params.push(filter.vinculoId);
        conditions.push(`vinculo_id = $${params.length}`);
      }
      if (filter.categoria) {
        params.push(filter.categoria);
        conditions.push(`categoria = $${params.length}`);
      }
      const rows = await this.dataSource.query<ObraPrivadaArquivoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."obra_privada_arquivo" WHERE ${conditions.join(' AND ')} ORDER BY ordem ASC, created_at ASC`,
        params,
      );
      return right(
        rows.map((row) =>
          ObraPrivadaArquivoMapper.toEntity(row as ObraPrivadaArquivoModel),
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async delete(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."obra_privada_arquivo" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  private failed(cause: unknown): ObraPrivadaArquivoRepositoryException {
    return new ObraPrivadaArquivoRepositoryException({
      code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

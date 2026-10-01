import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { unit, type Unit } from '@/core/types/unit';
import { left, right } from '@/core/types/either';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';
import ObraPrivadaObservacaoRepositoryException from '@/modules/obras-privadas/exceptions/obra_privada_observacao_repository.exception';
import ObraPrivadaObservacaoMapper from '@/modules/obras-privadas/infra/mapper/obra_privada_observacao.mapper';
import ObraPrivadaObservacaoModel from '@/modules/obras-privadas/infra/models/obra_privada_observacao.model';
import { DataSource } from 'typeorm';

const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", texto, autor_usuario_id AS "autorUsuarioId", created_at AS "createdAt"`;

export default class ObraPrivadaObservacaoRepository implements IObraPrivadaObservacaoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: ObraPrivadaObservacaoEntity,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = ObraPrivadaObservacaoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<ObraPrivadaObservacaoModel[]>(
        `INSERT INTO "${schema}"."obra_privada_observacao" (id, tenant_id, obra_privada_id, texto, autor_usuario_id, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.texto,
          model.autorUsuarioId,
          model.createdAt,
        ],
      );
      return right(
        ObraPrivadaObservacaoMapper.toEntity(
          saved as ObraPrivadaObservacaoModel,
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ObraPrivadaObservacaoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."obra_privada_observacao" WHERE id = $1`,
        [id],
      );
      return right(
        row
          ? ObraPrivadaObservacaoMapper.toEntity(
              row as ObraPrivadaObservacaoModel,
            )
          : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, ObraPrivadaObservacaoEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<ObraPrivadaObservacaoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."obra_privada_observacao" WHERE obra_privada_id = $1 ORDER BY created_at DESC`,
        [obraPrivadaId],
      );
      return right(
        rows.map((row) =>
          ObraPrivadaObservacaoMapper.toEntity(
            row as ObraPrivadaObservacaoModel,
          ),
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
        `DELETE FROM "${schema}"."obra_privada_observacao" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  private failed(cause: unknown): ObraPrivadaObservacaoRepositoryException {
    return new ObraPrivadaObservacaoRepositoryException({
      code: ErrorCodeConstants.OBRA_PRIVADA_OBSERVACAO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

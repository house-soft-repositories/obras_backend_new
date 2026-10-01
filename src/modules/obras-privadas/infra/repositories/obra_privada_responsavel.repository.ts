import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { unit, type Unit } from '@/core/types/unit';
import { left, right } from '@/core/types/either';
import IObraPrivadaResponsavelRepository, {
  ObraPrivadaResponsavelUpdate,
} from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import ObraPrivadaResponsavelRepositoryException from '@/modules/obras-privadas/exceptions/obra_privada_responsavel_repository.exception';
import ObraPrivadaResponsavelMapper from '@/modules/obras-privadas/infra/mapper/obra_privada_responsavel.mapper';
import ObraPrivadaResponsavelModel from '@/modules/obras-privadas/infra/models/obra_privada_responsavel.model';
import { DataSource } from 'typeorm';
const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", profissional_tecnico_id AS "profissionalTecnicoId", papel, tipo_documento AS "tipoDocumento", numero_documento AS "numeroDocumento", data_documento AS "dataDocumento", arquivo_id AS "arquivoId", data_inicio AS "dataInicio", data_baixa AS "dataBaixa", motivo_baixa AS "motivoBaixa", created_at AS "createdAt", updated_at AS "updatedAt"`;
const UPDATE_COLUMNS: Record<keyof ObraPrivadaResponsavelUpdate, string> = {
  id: 'id',
  tenantId: 'tenant_id',
  obraPrivadaId: 'obra_privada_id',
  profissionalTecnicoId: 'profissional_tecnico_id',
  papel: 'papel',
  tipoDocumento: 'tipo_documento',
  numeroDocumento: 'numero_documento',
  dataDocumento: 'data_documento',
  arquivoId: 'arquivo_id',
  dataInicio: 'data_inicio',
  dataBaixa: 'data_baixa',
  motivoBaixa: 'motivo_baixa',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};
export default class ObraPrivadaResponsavelRepository implements IObraPrivadaResponsavelRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}
  async save(
    entity: ObraPrivadaResponsavelEntity,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = ObraPrivadaResponsavelMapper.toModel(entity);
      const [saved] = await this.dataSource.query<
        ObraPrivadaResponsavelModel[]
      >(
        `INSERT INTO "${schema}"."obra_privada_responsavel" (id, tenant_id, obra_privada_id, profissional_tecnico_id, papel, tipo_documento, numero_documento, data_documento, arquivo_id, data_inicio, data_baixa, motivo_baixa, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.profissionalTecnicoId,
          model.papel,
          model.tipoDocumento,
          model.numeroDocumento,
          model.dataDocumento,
          model.arquivoId,
          model.dataInicio,
          model.dataBaixa,
          model.motivoBaixa,
          model.createdAt,
          model.updatedAt,
        ],
      );
      return right(
        ObraPrivadaResponsavelMapper.toEntity(
          saved as ObraPrivadaResponsavelModel,
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ObraPrivadaResponsavelModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."obra_privada_responsavel" WHERE id = $1`,
        [id],
      );
      return right(
        row
          ? ObraPrivadaResponsavelMapper.toEntity(
              row as ObraPrivadaResponsavelModel,
            )
          : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<ObraPrivadaResponsavelModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."obra_privada_responsavel" WHERE obra_privada_id = $1 ORDER BY data_baixa NULLS FIRST, created_at DESC`,
        [obraPrivadaId],
      );
      return right(
        rows.map((row) =>
          ObraPrivadaResponsavelMapper.toEntity(
            row as ObraPrivadaResponsavelModel,
          ),
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async update(
    id: string,
    props: ObraPrivadaResponsavelUpdate,
  ): AsyncResult<AppException, ObraPrivadaResponsavelEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const entries = Object.entries(props).filter(
        ([property, value]) =>
          value !== undefined &&
          ![
            'id',
            'tenantId',
            'obraPrivadaId',
            'createdAt',
            'updatedAt',
          ].includes(property),
      ) as [
        keyof ObraPrivadaResponsavelUpdate,
        ObraPrivadaResponsavelUpdate[keyof ObraPrivadaResponsavelUpdate],
      ][];
      if (entries.length === 0) return this.findById(id);
      const setSql = entries
        .map(
          ([property], index) => `${UPDATE_COLUMNS[property]} = $${index + 2}`,
        )
        .join(', ');
      const [row] = await this.dataSource.query<ObraPrivadaResponsavelModel[]>(
        `UPDATE "${schema}"."obra_privada_responsavel" SET ${setSql}, updated_at = now() WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
        [id, ...entries.map(([, value]) => value)],
      );
      return right(
        row
          ? ObraPrivadaResponsavelMapper.toEntity(
              row as ObraPrivadaResponsavelModel,
            )
          : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async delete(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."obra_privada_responsavel" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  private failed(cause: unknown): ObraPrivadaResponsavelRepositoryException {
    return new ObraPrivadaResponsavelRepositoryException({
      code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

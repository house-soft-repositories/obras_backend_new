import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { unit, type Unit } from '@/core/types/unit';
import { left, right } from '@/core/types/either';
import IAlvaraRepository, {
  AlvaraUpdate,
} from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import AlvaraRepositoryException from '@/modules/obras-privadas/exceptions/alvara_repository.exception';
import AlvaraMapper from '@/modules/obras-privadas/infra/mapper/alvara.mapper';
import AlvaraModel from '@/modules/obras-privadas/infra/models/alvara.model';
import { DataSource } from 'typeorm';

const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", numero, ano, tipo, motivo, situacao, data_emissao AS "dataEmissao", data_validade AS "dataValidade", alvara_anterior_id AS "alvaraAnteriorId", area_terreno_m2 AS "areaTerrenoM2", area_construida_aprovada_m2 AS "areaConstruidaAprovadaM2", uso, pavimentos, unidades, processo_administrativo AS "processoAdministrativo", arquivo_id AS "arquivoId", observacoes, created_at AS "createdAt", updated_at AS "updatedAt"`;

const UPDATE_COLUMNS: Record<keyof AlvaraUpdate, string> = {
  id: 'id',
  tenantId: 'tenant_id',
  obraPrivadaId: 'obra_privada_id',
  numero: 'numero',
  ano: 'ano',
  tipo: 'tipo',
  motivo: 'motivo',
  situacao: 'situacao',
  dataEmissao: 'data_emissao',
  dataValidade: 'data_validade',
  alvaraAnteriorId: 'alvara_anterior_id',
  areaTerrenoM2: 'area_terreno_m2',
  areaConstruidaAprovadaM2: 'area_construida_aprovada_m2',
  uso: 'uso',
  pavimentos: 'pavimentos',
  unidades: 'unidades',
  processoAdministrativo: 'processo_administrativo',
  arquivoId: 'arquivo_id',
  observacoes: 'observacoes',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

export default class AlvaraRepository implements IAlvaraRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: AlvaraEntity): AsyncResult<AppException, AlvaraEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = AlvaraMapper.toModel(entity);
      const [saved] = await this.dataSource.query<AlvaraModel[]>(
        `INSERT INTO "${schema}"."alvara" (id, tenant_id, obra_privada_id, numero, ano, tipo, motivo, situacao, data_emissao, data_validade, alvara_anterior_id, area_terreno_m2, area_construida_aprovada_m2, uso, pavimentos, unidades, processo_administrativo, arquivo_id, observacoes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.numero,
          model.ano,
          model.tipo,
          model.motivo,
          model.situacao,
          model.dataEmissao,
          model.dataValidade,
          model.alvaraAnteriorId,
          model.areaTerrenoM2,
          model.areaConstruidaAprovadaM2,
          model.uso,
          model.pavimentos,
          model.unidades,
          model.processoAdministrativo,
          model.arquivoId,
          model.observacoes,
          model.createdAt,
          model.updatedAt,
        ],
      );
      return right(AlvaraMapper.toEntity(saved as AlvaraModel));
    } catch (cause) {
      return left(
        new AlvaraRepositoryException({
          code: ErrorCodeConstants.ALVARA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, AlvaraEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<AlvaraModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."alvara" WHERE id = $1`,
        [id],
      );
      return right(row ? AlvaraMapper.toEntity(row as AlvaraModel) : null);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, AlvaraEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<AlvaraModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."alvara" WHERE obra_privada_id = $1 ORDER BY ano DESC, data_emissao DESC NULLS LAST, created_at DESC`,
        [obraPrivadaId],
      );
      return right(
        rows.map((row) => AlvaraMapper.toEntity(row as AlvaraModel)),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async update(
    id: string,
    props: AlvaraUpdate,
  ): AsyncResult<AppException, AlvaraEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const entries = Object.entries(props).filter(
        ([property, value]) =>
          value !== undefined &&
          property !== 'id' &&
          property !== 'tenantId' &&
          property !== 'obraPrivadaId' &&
          property !== 'createdAt' &&
          property !== 'updatedAt',
      ) as [keyof AlvaraUpdate, AlvaraUpdate[keyof AlvaraUpdate]][];
      if (entries.length === 0) return this.findById(id);
      const setSql = entries
        .map(
          ([property], index) => `${UPDATE_COLUMNS[property]} = $${index + 2}`,
        )
        .join(', ');
      const values = [id, ...entries.map(([, value]) => value)];
      const [row] = await this.dataSource.query<AlvaraModel[]>(
        `UPDATE "${schema}"."alvara" SET ${setSql}, updated_at = now() WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
        values,
      );
      return right(row ? AlvaraMapper.toEntity(row as AlvaraModel) : null);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async delete(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."alvara" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  private failed(cause: unknown): AlvaraRepositoryException {
    return new AlvaraRepositoryException({
      code: ErrorCodeConstants.ALVARA_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

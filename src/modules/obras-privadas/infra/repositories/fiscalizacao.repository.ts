import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { unit, type Unit } from '@/core/types/unit';
import { left, right } from '@/core/types/either';
import IFiscalizacaoRepository, {
  FiscalizacaoUpdate,
} from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import { ListFiscalizacoesGlobalQuery } from '@/modules/obras-privadas/infra/query/list_fiscalizacoes_global.query';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import FiscalizacaoRepositoryException from '@/modules/obras-privadas/exceptions/fiscalizacao_repository.exception';
import FiscalizacaoMapper, {
  FiscalizacaoGlobalRow,
} from '@/modules/obras-privadas/infra/mapper/fiscalizacao.mapper';
import FiscalizacaoModel from '@/modules/obras-privadas/infra/models/fiscalizacao.model';
import { FiscalizacaoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/fiscalizacao_global_read_model';
import { DataSource } from 'typeorm';

const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", numero, tipo, data_fiscalizacao AS "dataFiscalizacao", fiscal_usuario_id AS "fiscalUsuarioId", resultado, etapa_constatada AS "etapaConstatada", constatacoes, providencias, latitude, longitude, entulho_ha_irregularidade AS "entulhoHaIrregularidade", entulho_volume_estimado_m3 AS "entulhoVolumeEstimadoM3", entulho_local AS "entulhoLocal", entulho_possui_cacamba AS "entulhoPossuiCacamba", entulho_possui_pgrcc AS "entulhoPossuiPgrcc", entulho_destinacao AS "entulhoDestinacao", created_at AS "createdAt", updated_at AS "updatedAt"`;

const UPDATE_COLUMNS: Record<keyof FiscalizacaoUpdate, string> = {
  id: 'id',
  tenantId: 'tenant_id',
  obraPrivadaId: 'obra_privada_id',
  numero: 'numero',
  tipo: 'tipo',
  dataFiscalizacao: 'data_fiscalizacao',
  fiscalUsuarioId: 'fiscal_usuario_id',
  resultado: 'resultado',
  etapaConstatada: 'etapa_constatada',
  constatacoes: 'constatacoes',
  providencias: 'providencias',
  latitude: 'latitude',
  longitude: 'longitude',
  entulhoHaIrregularidade: 'entulho_ha_irregularidade',
  entulhoVolumeEstimadoM3: 'entulho_volume_estimado_m3',
  entulhoLocal: 'entulho_local',
  entulhoPossuiCacamba: 'entulho_possui_cacamba',
  entulhoPossuiPgrcc: 'entulho_possui_pgrcc',
  entulhoDestinacao: 'entulho_destinacao',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

export default class FiscalizacaoRepository implements IFiscalizacaoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: FiscalizacaoEntity,
  ): AsyncResult<AppException, FiscalizacaoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = FiscalizacaoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<FiscalizacaoModel[]>(
        `INSERT INTO "${schema}"."fiscalizacao" (id, tenant_id, obra_privada_id, numero, tipo, data_fiscalizacao, fiscal_usuario_id, resultado, etapa_constatada, constatacoes, providencias, latitude, longitude, entulho_ha_irregularidade, entulho_volume_estimado_m3, entulho_local, entulho_possui_cacamba, entulho_possui_pgrcc, entulho_destinacao, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.numero,
          model.tipo,
          model.dataFiscalizacao,
          model.fiscalUsuarioId,
          model.resultado,
          model.etapaConstatada,
          model.constatacoes,
          model.providencias,
          model.latitude,
          model.longitude,
          model.entulhoHaIrregularidade,
          model.entulhoVolumeEstimadoM3,
          model.entulhoLocal,
          model.entulhoPossuiCacamba,
          model.entulhoPossuiPgrcc,
          model.entulhoDestinacao,
          model.createdAt,
          model.updatedAt,
        ],
      );
      return right(FiscalizacaoMapper.toEntity(saved as FiscalizacaoModel));
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, FiscalizacaoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<FiscalizacaoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."fiscalizacao" WHERE id = $1`,
        [id],
      );
      return right(
        row ? FiscalizacaoMapper.toEntity(row as FiscalizacaoModel) : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, FiscalizacaoEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<FiscalizacaoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."fiscalizacao" WHERE obra_privada_id = $1 ORDER BY data_fiscalizacao DESC, created_at DESC`,
        [obraPrivadaId],
      );
      return right(
        rows.map((row) =>
          FiscalizacaoMapper.toEntity(row as FiscalizacaoModel),
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findLastNumero(year: number): AsyncResult<AppException, string | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<{ numero: string }[]>(
        `SELECT numero FROM "${schema}"."fiscalizacao" WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1`,
        [`FIS-${year}-%`],
      );
      return right(row?.numero ?? null);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async update(
    id: string,
    props: FiscalizacaoUpdate,
  ): AsyncResult<AppException, FiscalizacaoEntity | null> {
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
        keyof FiscalizacaoUpdate,
        FiscalizacaoUpdate[keyof FiscalizacaoUpdate],
      ][];
      if (entries.length === 0) return this.findById(id);
      const setSql = entries
        .map(
          ([property], index) => `${UPDATE_COLUMNS[property]} = $${index + 2}`,
        )
        .join(', ');
      const [row] = await this.dataSource.query<FiscalizacaoModel[]>(
        `UPDATE "${schema}"."fiscalizacao" SET ${setSql}, updated_at = now() WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
        [id, ...entries.map(([, value]) => value)],
      );
      return right(
        row ? FiscalizacaoMapper.toEntity(row as FiscalizacaoModel) : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async delete(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."fiscalizacao" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async listGlobal(
    pageOptions: PageOptionsEntity,
    filter: ListFiscalizacoesGlobalQuery,
  ): AsyncResult<AppException, PageEntity<FiscalizacaoGlobalReadModel>> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const conditions = ['o.deleted_at IS NULL'];
      const params: unknown[] = [];
      let idx = 1;
      const push = (value: unknown): string => {
        params.push(value);
        return `$${idx++}`;
      };
      if (filter.busca?.trim()) {
        const termo = `%${filter.busca.trim()}%`;
        conditions.push(
          `(f.numero ILIKE ${push(termo)} OR o.codigo ILIKE ${push(termo)} OR o.logradouro ILIKE ${push(termo)})`,
        );
      }
      if (filter.fiscalUsuarioId)
        conditions.push(`f.fiscal_usuario_id = ${push(filter.fiscalUsuarioId)}`);
      if (filter.tipo) conditions.push(`f.tipo = ${push(filter.tipo)}`);
      if (filter.resultado)
        conditions.push(`f.resultado = ${push(filter.resultado)}`);
      if (filter.dataInicio)
        conditions.push(`f.data_fiscalizacao >= ${push(filter.dataInicio)}`);
      if (filter.dataFim)
        conditions.push(`f.data_fiscalizacao <= ${push(filter.dataFim)}`);
      const where = conditions.join(' AND ');
      const from = `"${schema}"."fiscalizacao" f INNER JOIN "${schema}"."obras_privadas" o ON o.id = f.obra_privada_id`;
      const [countRow] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM ${from} WHERE ${where}`,
        params,
      );
      const rows = await this.dataSource.query<FiscalizacaoGlobalRow[]>(
        `SELECT f.id AS id, f.numero AS numero, f.tipo AS tipo, f.resultado AS resultado, f.data_fiscalizacao AS "dataFiscalizacao", f.fiscal_usuario_id AS "fiscalUsuarioId", f.etapa_constatada AS "etapaConstatada", o.id AS "obraPrivadaId", o.codigo AS "obraCodigo", CONCAT_WS(', ', o.logradouro, o.numero) AS "obraEndereco" FROM ${from} WHERE ${where} ORDER BY f.data_fiscalizacao DESC, f.numero DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, pageOptions.take, pageOptions.skip],
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countRow?.count ?? 0),
      });
      return right(
        new PageEntity(
          rows.map((row) => FiscalizacaoMapper.toGlobalReadModel(row)),
          meta,
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  private failed(cause: unknown): FiscalizacaoRepositoryException {
    return new FiscalizacaoRepositoryException({
      code: ErrorCodeConstants.FISCALIZACAO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAutoInfracaoRepository, {
  AutoInfracaoUpdate,
} from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import { ListAutosGlobalQuery } from '@/modules/obras-privadas/infra/query/list_autos_global.query';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import AutoInfracaoRepositoryException from '@/modules/obras-privadas/exceptions/auto_infracao_repository.exception';
import AutoInfracaoMapper, {
  AutoGlobalRow,
} from '@/modules/obras-privadas/infra/mapper/auto_infracao.mapper';
import AutoInfracaoModel from '@/modules/obras-privadas/infra/models/auto_infracao.model';
import { AutoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/auto_global_read_model';
import { DataSource } from 'typeorm';

const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", fiscalizacao_id AS "fiscalizacaoId", numero, tipo, data_emissao AS "dataEmissao", prazo_dias AS "prazoDias", data_limite AS "dataLimite", base_legal AS "baseLegal", descricao, valor_multa AS "valorMulta", situacao, data_encerramento AS "dataEncerramento", observacoes, lavrado_por_usuario_id AS "lavradoPorUsuarioId", created_at AS "createdAt", updated_at AS "updatedAt"`;

const UPDATE_COLUMNS: Record<keyof AutoInfracaoUpdate, string> = {
  id: 'id',
  tenantId: 'tenant_id',
  obraPrivadaId: 'obra_privada_id',
  fiscalizacaoId: 'fiscalizacao_id',
  numero: 'numero',
  tipo: 'tipo',
  dataEmissao: 'data_emissao',
  prazoDias: 'prazo_dias',
  dataLimite: 'data_limite',
  baseLegal: 'base_legal',
  descricao: 'descricao',
  valorMulta: 'valor_multa',
  situacao: 'situacao',
  dataEncerramento: 'data_encerramento',
  observacoes: 'observacoes',
  lavradoPorUsuarioId: 'lavrado_por_usuario_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

export default class AutoInfracaoRepository implements IAutoInfracaoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: AutoInfracaoEntity,
  ): AsyncResult<AppException, AutoInfracaoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = AutoInfracaoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<AutoInfracaoModel[]>(
        `INSERT INTO "${schema}"."auto_infracao" (id, tenant_id, obra_privada_id, fiscalizacao_id, numero, tipo, data_emissao, prazo_dias, data_limite, base_legal, descricao, valor_multa, situacao, data_encerramento, observacoes, lavrado_por_usuario_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.fiscalizacaoId,
          model.numero,
          model.tipo,
          model.dataEmissao,
          model.prazoDias,
          model.dataLimite,
          model.baseLegal,
          model.descricao,
          model.valorMulta,
          model.situacao,
          model.dataEncerramento,
          model.observacoes,
          model.lavradoPorUsuarioId,
          model.createdAt,
          model.updatedAt,
        ],
      );
      return right(AutoInfracaoMapper.toEntity(saved as AutoInfracaoModel));
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, AutoInfracaoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<AutoInfracaoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."auto_infracao" WHERE id = $1`,
        [id],
      );
      return right(
        row ? AutoInfracaoMapper.toEntity(row as AutoInfracaoModel) : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, AutoInfracaoEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<AutoInfracaoModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."auto_infracao" WHERE obra_privada_id = $1 ORDER BY data_emissao DESC, created_at DESC`,
        [obraPrivadaId],
      );
      return right(
        rows.map((row) =>
          AutoInfracaoMapper.toEntity(row as AutoInfracaoModel),
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
        `SELECT numero FROM "${schema}"."auto_infracao" WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1`,
        [`AI-${year}-%`],
      );
      return right(row?.numero ?? null);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async update(
    id: string,
    props: AutoInfracaoUpdate,
  ): AsyncResult<AppException, AutoInfracaoEntity | null> {
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
        keyof AutoInfracaoUpdate,
        AutoInfracaoUpdate[keyof AutoInfracaoUpdate],
      ][];
      if (entries.length === 0) return this.findById(id);
      const setSql = entries
        .map(
          ([property], index) => `${UPDATE_COLUMNS[property]} = $${index + 2}`,
        )
        .join(', ');
      const [row] = await this.dataSource.query<AutoInfracaoModel[]>(
        `UPDATE "${schema}"."auto_infracao" SET ${setSql}, updated_at = now() WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
        [id, ...entries.map(([, value]) => value)],
      );
      return right(
        row ? AutoInfracaoMapper.toEntity(row as AutoInfracaoModel) : null,
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async listGlobal(
    pageOptions: PageOptionsEntity,
    filter: ListAutosGlobalQuery,
  ): AsyncResult<AppException, PageEntity<AutoGlobalReadModel>> {
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
          `(ai.numero ILIKE ${push(termo)} OR o.codigo ILIKE ${push(termo)} OR o.logradouro ILIKE ${push(termo)})`,
        );
      }
      if (filter.tipo) conditions.push(`ai.tipo = ${push(filter.tipo)}`);
      if (filter.situacao)
        conditions.push(`ai.situacao = ${push(filter.situacao)}`);
      if (filter.vencidos) {
        conditions.push('ai.data_limite IS NOT NULL');
        conditions.push('ai.data_limite < CURRENT_DATE');
        conditions.push(`ai.situacao IN ('ABERTO','EM_RECURSO')`);
      }
      if (filter.dataInicio)
        conditions.push(`ai.data_emissao >= ${push(filter.dataInicio)}`);
      if (filter.dataFim)
        conditions.push(`ai.data_emissao <= ${push(filter.dataFim)}`);
      const where = conditions.join(' AND ');
      const from = `"${schema}"."auto_infracao" ai INNER JOIN "${schema}"."obras_privadas" o ON o.id = ai.obra_privada_id`;
      const [countRow] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM ${from} WHERE ${where}`,
        params,
      );
      const rows = await this.dataSource.query<AutoGlobalRow[]>(
        `SELECT ai.id AS id, ai.numero AS numero, ai.tipo AS tipo, ai.situacao AS situacao, ai.data_emissao AS "dataEmissao", ai.prazo_dias AS "prazoDias", ai.data_limite AS "dataLimite", ai.valor_multa AS "valorMulta", o.id AS "obraPrivadaId", o.codigo AS "obraCodigo", CONCAT_WS(', ', o.logradouro, o.numero) AS "obraEndereco" FROM ${from} WHERE ${where} ORDER BY ai.data_emissao DESC, ai.numero DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, pageOptions.take, pageOptions.skip],
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countRow?.count ?? 0),
      });
      return right(
        new PageEntity(
          rows.map((row) => AutoInfracaoMapper.toGlobalReadModel(row)),
          meta,
        ),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  async countByTipo(): AsyncResult<AppException, Record<string, number>> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<
        { tipo: string; total: string }[]
      >(
        `SELECT ai.tipo AS tipo, COUNT(*) AS total FROM "${schema}"."auto_infracao" ai WHERE ai.situacao IN ('ABERTO','EM_RECURSO') GROUP BY ai.tipo`,
      );
      return right(
        Object.fromEntries(rows.map((row) => [row.tipo, Number(row.total)])),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }

  private failed(cause: unknown): AutoInfracaoRepositoryException {
    return new AutoInfracaoRepositoryException({
      code: ErrorCodeConstants.AUTO_INFRACAO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}

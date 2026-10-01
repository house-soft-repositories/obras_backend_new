import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import { ListLicenciamentoQuery } from '@/modules/obras-privadas/infra/query/list_licenciamento.query';
import { ListObrasQuery } from '@/modules/obras-privadas/infra/query/list_obras.query';
import ObraPrivadaEntity, {
  ObraPrivadaUpdate,
} from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import ObraPrivadaMapper, {
  LicenciamentoRow,
  ObraPrivadaListRow,
} from '@/modules/obras-privadas/infra/mapper/obra_privada.mapper';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { LicenciamentoListReadModel } from '@/modules/obras-privadas/infra/read-models/licenciamento_list_read_model';
import { ObraPrivadaListReadModel } from '@/modules/obras-privadas/infra/read-models/obra_privada_list_read_model';
import ObraPrivadaRepositoryException from '@/modules/obras-privadas/exceptions/obra_privada_repository.exception';

const OBRA_SELECT = `id,codigo,descricao,observacoes,proprietario_pessoa_id AS "proprietarioPessoaId",orgao_id AS "orgaoId",inscricao_imobiliaria AS "inscricaoImobiliaria",matricula_rgi AS "matriculaRgi",cartorio,cep,logradouro,numero,complemento,bairro,localidade_id AS "localidadeId",uf,latitude,longitude,geo_origem AS "geoOrigem",situacao_alvara AS "situacaoAlvara",andamento,habite_se AS "habiteSe",data_inicio AS "dataInicio",data_prevista_conclusao AS "dataPrevistaConclusao",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt"`;

const OBRA_UPDATE_COLUMNS: Record<keyof ObraPrivadaUpdate, string> = {
  descricao: 'descricao',
  observacoes: 'observacoes',
  proprietarioPessoaId: 'proprietario_pessoa_id',
  orgaoId: 'orgao_id',
  inscricaoImobiliaria: 'inscricao_imobiliaria',
  matriculaRgi: 'matricula_rgi',
  cartorio: 'cartorio',
  cep: 'cep',
  logradouro: 'logradouro',
  numero: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  localidadeId: 'localidade_id',
  uf: 'uf',
  latitude: 'latitude',
  longitude: 'longitude',
  geoOrigem: 'geo_origem',
  situacaoAlvara: 'situacao_alvara',
  andamento: 'andamento',
  habiteSe: 'habite_se',
  dataInicio: 'data_inicio',
  dataPrevistaConclusao: 'data_prevista_conclusao',
};

const table = (schema: string, name: string): string => `"${schema}"."${name}"`;

const EXISTS_AUTUADA = (schema: string, alias = 'o'): string =>
  `EXISTS (SELECT 1 FROM ${table(schema, 'auto_infracao')} ai WHERE ai.obra_privada_id = ${alias}.id AND ai.situacao IN ('ABERTO','EM_RECURSO'))`;

const EXISTS_EMBARGADA = (schema: string, alias = 'o'): string =>
  `EXISTS (SELECT 1 FROM ${table(schema, 'auto_infracao')} ai WHERE ai.obra_privada_id = ${alias}.id AND ai.tipo IN ('EMBARGO','INTERDICAO') AND ai.situacao = 'ABERTO')`;

const EXISTS_FISCALIZADA = (schema: string, alias = 'o'): string =>
  `EXISTS (SELECT 1 FROM ${table(schema, 'fiscalizacao')} f WHERE f.obra_privada_id = ${alias}.id)`;

const ULTIMA_VISITA = (schema: string, alias = 'o'): string =>
  `(SELECT MAX(f.data_fiscalizacao) FROM ${table(schema, 'fiscalizacao')} f WHERE f.obra_privada_id = ${alias}.id)`;

const ETAPA_ATUAL = (schema: string, alias = 'o'): string =>
  `(SELECT f.etapa_constatada FROM ${table(schema, 'fiscalizacao')} f WHERE f.obra_privada_id = ${alias}.id AND f.etapa_constatada IS NOT NULL ORDER BY f.data_fiscalizacao DESC, f.created_at DESC LIMIT 1)`;

const booleanExistsFilter = (existsSql: string, value: boolean): string =>
  value ? existsSql : `NOT ${existsSql}`;

function isPostgresErrorCode(cause: unknown, code: string): boolean {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    (cause as { code?: unknown }).code === code
  );
}

export default class ObraPrivadaRepository implements IObraPrivadaRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  async save(
    e: ObraPrivadaEntity,
  ): AsyncResult<AppException, ObraPrivadaEntity> {
    try {
      const s = this.tc.require().schemaName;
      const v = ObraPrivadaMapper.toModel(e);
      const [saved] = await this.ds.query<ObraPrivadaModel[]>(
        `INSERT INTO "${s}"."obras_privadas" (id,codigo,descricao,observacoes,proprietario_pessoa_id,orgao_id,inscricao_imobiliaria,matricula_rgi,cartorio,cep,logradouro,numero,complemento,bairro,localidade_id,uf,latitude,longitude,geo_origem,situacao_alvara,andamento,habite_se,data_inicio,data_prevista_conclusao,created_at,updated_at,deleted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) ON CONFLICT (id) DO UPDATE SET descricao=EXCLUDED.descricao, updated_at=EXCLUDED.updated_at RETURNING id,codigo,descricao,observacoes,proprietario_pessoa_id AS "proprietarioPessoaId",orgao_id AS "orgaoId",inscricao_imobiliaria AS "inscricaoImobiliaria",matricula_rgi AS "matriculaRgi",cartorio,cep,logradouro,numero,complemento,bairro,localidade_id AS "localidadeId",uf,latitude,longitude,geo_origem AS "geoOrigem",situacao_alvara AS "situacaoAlvara",andamento,habite_se AS "habiteSe",data_inicio AS "dataInicio",data_prevista_conclusao AS "dataPrevistaConclusao",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt"`,
        [
          v.id,
          v.codigo,
          v.descricao,
          v.observacoes,
          v.proprietarioPessoaId,
          v.orgaoId,
          v.inscricaoImobiliaria,
          v.matriculaRgi,
          v.cartorio,
          v.cep,
          v.logradouro,
          v.numero,
          v.complemento,
          v.bairro,
          v.localidadeId,
          v.uf,
          v.latitude,
          v.longitude,
          v.geoOrigem,
          v.situacaoAlvara,
          v.andamento,
          v.habiteSe,
          v.dataInicio,
          v.dataPrevistaConclusao,
          v.createdAt,
          v.updatedAt,
          v.deletedAt,
        ],
      );
      return right(ObraPrivadaMapper.toEntity(saved));
    } catch (cause) {
      if (isPostgresErrorCode(cause, '23505'))
        return left(
          new ObraPrivadaRepositoryException({
            code: ErrorCodeConstants.OBRA_PRIVADA_DUPLICATE_CODIGO,
            statusCode: 409,
            cause,
          }),
        );
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async findLastCodigo(y: number): AsyncResult<AppException, string | null> {
    try {
      const s = this.tc.require().schemaName;
      const p = `OBP-${y}-`;
      const [r] = await this.ds.query<{ codigo: string }[]>(
        `SELECT codigo FROM "${s}"."obras_privadas" WHERE codigo LIKE $1 ORDER BY codigo DESC LIMIT 1`,
        [`${p}%`],
      );
      return right(r?.codigo ?? null);
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [r] = await this.ds.query<ObraPrivadaModel[]>(
        `SELECT id,codigo,descricao,observacoes,proprietario_pessoa_id AS "proprietarioPessoaId",orgao_id AS "orgaoId",inscricao_imobiliaria AS "inscricaoImobiliaria",matricula_rgi AS "matriculaRgi",cartorio,cep,logradouro,numero,complemento,bairro,localidade_id AS "localidadeId",uf,latitude,longitude,geo_origem AS "geoOrigem",situacao_alvara AS "situacaoAlvara",andamento,habite_se AS "habiteSe",data_inicio AS "dataInicio",data_prevista_conclusao AS "dataPrevistaConclusao",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt" FROM "${s}"."obras_privadas" WHERE id=$1`,
        [id],
      );
      return right(r ? ObraPrivadaMapper.toEntity(r) : null);
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async findNoMesmoImovel(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const found = await this.findById(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return right([]);
      const o = found.value.toObject();
      const values: (string | null)[] = [id];
      let where = 'id <> $1 AND deleted_at IS NULL';
      if (o.inscricaoImobiliaria) {
        values.push(o.inscricaoImobiliaria);
        where += ` AND inscricao_imobiliaria = $${values.length}`;
      } else if (o.matriculaRgi) {
        values.push(o.matriculaRgi);
        where += ` AND matricula_rgi = $${values.length}`;
      } else {
        values.push(o.logradouro, o.numero, o.bairro);
        where += ` AND logradouro = $${values.length - 2} AND COALESCE(numero,'') = COALESCE($${values.length - 1},'') AND COALESCE(bairro,'') = COALESCE($${values.length},'')`;
      }
      const rows = await this.ds.query<ObraPrivadaModel[]>(
        `SELECT id,codigo,descricao,observacoes,proprietario_pessoa_id AS "proprietarioPessoaId",orgao_id AS "orgaoId",inscricao_imobiliaria AS "inscricaoImobiliaria",matricula_rgi AS "matriculaRgi",cartorio,cep,logradouro,numero,complemento,bairro,localidade_id AS "localidadeId",uf,latitude,longitude,geo_origem AS "geoOrigem",situacao_alvara AS "situacaoAlvara",andamento,habite_se AS "habiteSe",data_inicio AS "dataInicio",data_prevista_conclusao AS "dataPrevistaConclusao",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt" FROM "${s}"."obras_privadas" WHERE ${where} ORDER BY created_at DESC`,
        values,
      );
      return right(rows.map((r) => ObraPrivadaMapper.toEntity(r)));
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async update(
    id: string,
    props: ObraPrivadaUpdate,
  ): AsyncResult<AppException, ObraPrivadaEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const entries = Object.entries(props).filter(
        ([property, value]) =>
          value !== undefined && property in OBRA_UPDATE_COLUMNS,
      ) as [
        keyof ObraPrivadaUpdate,
        ObraPrivadaUpdate[keyof ObraPrivadaUpdate],
      ][];
      if (entries.length === 0) return this.findById(id);
      const setSql = entries
        .map(
          ([property], index) =>
            `${OBRA_UPDATE_COLUMNS[property]} = $${index + 2}`,
        )
        .join(', ');
      const values = [id, ...entries.map(([, value]) => value)];
      const [row] = await this.ds.query<ObraPrivadaModel[]>(
        `UPDATE "${s}"."obras_privadas" SET ${setSql}, updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING ${OBRA_SELECT}`,
        values,
      );
      return right(row ? ObraPrivadaMapper.toEntity(row) : null);
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async softDelete(id: string): AsyncResult<AppException, Unit> {
    try {
      const s = this.tc.require().schemaName;
      await this.ds.query(
        `UPDATE "${s}"."obras_privadas" SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async listObras(
    pageOptions: PageOptionsEntity,
    filter: ListObrasQuery,
  ): AsyncResult<AppException, PageEntity<ObraPrivadaListReadModel>> {
    try {
      const s = this.tc.require().schemaName;
      const conditions = ['o.deleted_at IS NULL'];
      const params: unknown[] = [];
      let idx = 1;
      const push = (value: unknown): string => {
        params.push(value);
        return `$${idx++}`;
      };
      if (filter.busca?.trim()) {
        const termo = `%${filter.busca.trim()}%`;
        const digitos = filter.busca.replace(/\D/g, '');
        if (digitos.length > 0) {
          conditions.push(
            `(o.codigo ILIKE ${push(termo)} OR o.logradouro ILIKE ${push(termo)} OR o.bairro ILIKE ${push(termo)} OR o.descricao ILIKE ${push(termo)} OR p.nome ILIKE ${push(termo)} OR p.documento LIKE ${push(`%${digitos}%`)})`,
          );
        } else {
          conditions.push(
            `(o.codigo ILIKE ${push(termo)} OR o.logradouro ILIKE ${push(termo)} OR o.bairro ILIKE ${push(termo)} OR o.descricao ILIKE ${push(termo)} OR p.nome ILIKE ${push(termo)})`,
          );
        }
      }
      if (filter.situacaoAlvara)
        conditions.push(`o.situacao_alvara = ${push(filter.situacaoAlvara)}`);
      if (filter.andamento)
        conditions.push(`o.andamento = ${push(filter.andamento)}`);
      if (filter.habiteSe)
        conditions.push(`o.habite_se = ${push(filter.habiteSe)}`);
      if (filter.bairro)
        conditions.push(`o.bairro ILIKE ${push(`%${filter.bairro}%`)}`);
      if (filter.orgaoId)
        conditions.push(`o.orgao_id = ${push(filter.orgaoId)}`);
      if (filter.localidadeId)
        conditions.push(`o.localidade_id = ${push(filter.localidadeId)}`);
      if (filter.autuada !== undefined)
        conditions.push(booleanExistsFilter(EXISTS_AUTUADA(s), filter.autuada));
      if (filter.embargada !== undefined)
        conditions.push(
          booleanExistsFilter(EXISTS_EMBARGADA(s), filter.embargada),
        );
      if (filter.fiscalizada !== undefined)
        conditions.push(
          booleanExistsFilter(EXISTS_FISCALIZADA(s), filter.fiscalizada),
        );
      if (filter.semVisitaHaDias !== undefined) {
        const dias = push(filter.semVisitaHaDias);
        conditions.push(
          `(${ULTIMA_VISITA(s)} IS NULL OR ${ULTIMA_VISITA(s)} < CURRENT_DATE - ${dias} * INTERVAL '1 day')`,
        );
      }
      const where = conditions.join(' AND ');
      const from = `"${s}"."obras_privadas" o INNER JOIN "${s}"."pessoas" p ON p.id = o.proprietario_pessoa_id`;
      const [countRow] = await this.ds.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM ${from} WHERE ${where}`,
        params,
      );
      const rows = await this.ds.query<ObraPrivadaListRow[]>(
        `SELECT o.id AS id, o.codigo AS codigo, o.logradouro AS logradouro, o.numero AS numero, o.bairro AS bairro, o.uf AS uf, o.latitude AS latitude, o.longitude AS longitude, o.situacao_alvara AS "situacaoAlvara", o.andamento AS andamento, o.habite_se AS "habiteSe", p.nome AS "proprietarioNome", p.documento AS "proprietarioDocumento", ${ETAPA_ATUAL(s)} AS "etapaAtual", ${ULTIMA_VISITA(s)} AS "ultimaVisitaEm", ${EXISTS_FISCALIZADA(s)} AS fiscalizada, ${EXISTS_AUTUADA(s)} AS autuada, ${EXISTS_EMBARGADA(s)} AS embargada FROM ${from} WHERE ${where} ORDER BY o.codigo ${pageOptions.order} LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, pageOptions.take, pageOptions.skip],
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countRow?.count ?? 0),
      });
      return right(
        new PageEntity(
          rows.map((row) => ObraPrivadaMapper.toListReadModel(row)),
          meta,
        ),
      );
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async listLicenciamento(
    pageOptions: PageOptionsEntity,
    filter: ListLicenciamentoQuery,
  ): AsyncResult<AppException, PageEntity<LicenciamentoListReadModel>> {
    try {
      const s = this.tc.require().schemaName;
      const conditions = ['o.deleted_at IS NULL'];
      const params: unknown[] = [];
      let idx = 1;
      const push = (value: unknown): string => {
        params.push(value);
        return `$${idx++}`;
      };
      if (filter.busca?.trim()) {
        const termo = `%${filter.busca.trim()}%`;
        const digitos = filter.busca.replace(/\D/g, '');
        if (digitos.length > 0) {
          conditions.push(
            `(o.codigo ILIKE ${push(termo)} OR o.logradouro ILIKE ${push(termo)} OR o.bairro ILIKE ${push(termo)} OR o.descricao ILIKE ${push(termo)} OR p.nome ILIKE ${push(termo)} OR p.documento LIKE ${push(`%${digitos}%`)})`,
          );
        } else {
          conditions.push(
            `(o.codigo ILIKE ${push(termo)} OR o.logradouro ILIKE ${push(termo)} OR o.bairro ILIKE ${push(termo)} OR o.descricao ILIKE ${push(termo)} OR p.nome ILIKE ${push(termo)})`,
          );
        }
      }
      if (filter.situacaoAlvara)
        conditions.push(`o.situacao_alvara = ${push(filter.situacaoAlvara)}`);
      if (filter.habiteSe)
        conditions.push(`o.habite_se = ${push(filter.habiteSe)}`);
      if (filter.vencendoEmDias !== undefined) {
        const venc = push(filter.vencendoEmDias);
        conditions.push('a.data_validade IS NOT NULL');
        conditions.push('a.data_validade >= CURRENT_DATE');
        conditions.push(
          `a.data_validade <= CURRENT_DATE + ${venc} * INTERVAL '1 day'`,
        );
      }
      const where = conditions.join(' AND ');
      const from = `"${s}"."obras_privadas" o INNER JOIN "${s}"."pessoas" p ON p.id = o.proprietario_pessoa_id LEFT JOIN "${s}"."alvara" a ON a.id = (SELECT a2.id FROM "${s}"."alvara" a2 WHERE a2.obra_privada_id = o.id AND a2.situacao = 'VIGENTE' ORDER BY a2.data_emissao DESC NULLS LAST LIMIT 1)`;
      const [countRow] = await this.ds.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM ${from} WHERE ${where}`,
        params,
      );
      const rows = await this.ds.query<LicenciamentoRow[]>(
        `SELECT o.id AS "obraPrivadaId", o.codigo AS "obraCodigo", CONCAT_WS(', ', o.logradouro, o.numero) AS "obraEndereco", p.nome AS "proprietarioNome", o.situacao_alvara AS "situacaoAlvara", o.habite_se AS "habiteSe", a.numero AS "alvaraNumeroBruto", a.ano AS "alvaraAno", a.tipo AS "alvaraTipo", a.data_validade AS "alvaraDataValidade" FROM ${from} WHERE ${where} ORDER BY a.data_validade ASC NULLS LAST, o.codigo DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, pageOptions.take, pageOptions.skip],
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countRow?.count ?? 0),
      });
      return right(
        new PageEntity(
          rows.map((row) => ObraPrivadaMapper.toLicenciamentoReadModel(row)),
          meta,
        ),
      );
    } catch (cause) {
      return left(
        new ObraPrivadaRepositoryException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

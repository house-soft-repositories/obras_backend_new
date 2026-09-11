import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository, { ObraFindPageParams } from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraMapper from '@/modules/obras/infra/mapper/obra.mapper';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';

export default class ObraRepository implements IObraRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async save(e: ObraEntity): AsyncResult<AppException, ObraEntity> {
    try {
      const s = this.tc.require().schemaName;
      const v = ObraMapper.toModel(e) as Record<string, unknown>;
      const cols = [
        'id',
        'codigo',
        'nome',
        'descricao',
        'tipo',
        'status',
        'tipo_financiamento',
        'modo_duracao',
        'data_inicio',
        'data_prazo',
        'acao_conveniada',
        'prioritaria',
        'exibir_camera_ao_vivo',
        'camera_url',
        'privado',
        'invisivel',
        'considerar_sabado',
        'considerar_domingo',
        'seguir_automatico',
        'vincular_pagamento_percentual',
        'corresponsaveis_podem_editar',
        'orgao_id',
        'setor_id',
        'localidade_id',
        'subclassificacao_id',
        'eixo_id',
        'classificacao_id',
        'tipologia_id',
        'subtipologia_id',
        'programa_ppa',
        'acao_estrategica',
        'acao_orcamentaria',
        'unidade_medida',
        'quantidade',
        'secretario',
        'data_pactuada',
        'criado_por_usuario_id',
        'created_at',
        'updated_at',
        'deleted_at',
      ];
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
      const values = [
        v['id'],
        v['codigo'],
        v['nome'],
        v['descricao'],
        v['tipo'],
        v['status'],
        v['tipoFinanciamento'],
        v['modoDuracao'],
        v['dataInicio'],
        v['dataPrazo'],
        v['acaoConveniada'],
        v['prioritaria'],
        v['exibirCameraAoVivo'],
        v['cameraUrl'],
        v['privado'],
        v['invisivel'],
        v['considerarSabado'],
        v['considerarDomingo'],
        v['seguirAutomatico'],
        v['vincularPagamentoPercentual'],
        v['corresponsaveisPodemEditar'],
        v['orgaoId'],
        v['setorId'],
        v['localidadeId'],
        v['subclassificacaoId'],
        v['eixoId'],
        v['classificacaoId'],
        v['tipologiaId'],
        v['subtipologiaId'],
        v['programaPpa'],
        v['acaoEstrategica'],
        v['acaoOrcamentaria'],
        v['unidadeMedida'],
        v['quantidade'],
        v['secretario'],
        v['dataPactuada'],
        v['criadoPorUsuarioId'],
        v['createdAt'],
        v['updatedAt'],
        v['deletedAt'],
      ];
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."obras" (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome, descricao=EXCLUDED.descricao, tipo=EXCLUDED.tipo, status=EXCLUDED.status, tipo_financiamento=EXCLUDED.tipo_financiamento, modo_duracao=EXCLUDED.modo_duracao, data_inicio=EXCLUDED.data_inicio, data_prazo=EXCLUDED.data_prazo, acao_conveniada=EXCLUDED.acao_conveniada, prioritaria=EXCLUDED.prioritaria, exibir_camera_ao_vivo=EXCLUDED.exibir_camera_ao_vivo, camera_url=EXCLUDED.camera_url, privado=EXCLUDED.privado, invisivel=EXCLUDED.invisivel, considerar_sabado=EXCLUDED.considerar_sabado, considerar_domingo=EXCLUDED.considerar_domingo, seguir_automatico=EXCLUDED.seguir_automatico, vincular_pagamento_percentual=EXCLUDED.vincular_pagamento_percentual, corresponsaveis_podem_editar=EXCLUDED.corresponsaveis_podem_editar, programa_ppa=EXCLUDED.programa_ppa, acao_estrategica=EXCLUDED.acao_estrategica, acao_orcamentaria=EXCLUDED.acao_orcamentaria, unidade_medida=EXCLUDED.unidade_medida, quantidade=EXCLUDED.quantidade, secretario=EXCLUDED.secretario, data_pactuada=EXCLUDED.data_pactuada, updated_at=EXCLUDED.updated_at RETURNING id,codigo,nome,descricao,tipo,status,tipo_financiamento AS "tipoFinanciamento",modo_duracao AS "modoDuracao",data_inicio AS "dataInicio",data_prazo AS "dataPrazo",acao_conveniada AS "acaoConveniada",prioritaria,exibir_camera_ao_vivo AS "exibirCameraAoVivo",camera_url AS "cameraUrl",privado,invisivel,considerar_sabado AS "considerarSabado",considerar_domingo AS "considerarDomingo",seguir_automatico AS "seguirAutomatico",vincular_pagamento_percentual AS "vincularPagamentoPercentual",corresponsaveis_podem_editar AS "corresponsaveisPodemEditar",orgao_id AS "orgaoId",setor_id AS "setorId",localidade_id AS "localidadeId",subclassificacao_id AS "subclassificacaoId",eixo_id AS "eixoId",classificacao_id AS "classificacaoId",tipologia_id AS "tipologiaId",subtipologia_id AS "subtipologiaId",programa_ppa AS "programaPpa",acao_estrategica AS "acaoEstrategica",acao_orcamentaria AS "acaoOrcamentaria",unidade_medida AS "unidadeMedida",quantidade,secretario,data_pactuada AS "dataPactuada",criado_por_usuario_id AS "criadoPorUsuarioId",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt"`,
        values,
      );
      return right(ObraMapper.toEntity(saved as unknown as ObraModel & Record<string, unknown>));
    } catch (cause: unknown) {
      const c = cause as { code?: string };
      if (c?.code === '23505')
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,
            statusCode: 409,
            cause,
          }),
        );
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findLastCodigo(year: number): AsyncResult<AppException, string | null> {
    try {
      const s = this.tc.require().schemaName;
      const prefix = `OBR-${year}-`;
      const [row] = await this.ds.query<{ codigo: string }[]>(
        `SELECT codigo FROM "${s}"."obras" WHERE codigo LIKE $1 ORDER BY codigo DESC LIMIT 1`,
        [`${prefix}%`],
      );
      return right(row?.codigo ?? null);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, ObraEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const [r] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id,codigo,nome,descricao,tipo,status,tipo_financiamento AS "tipoFinanciamento",modo_duracao AS "modoDuracao",data_inicio AS "dataInicio",data_prazo AS "dataPrazo",acao_conveniada AS "acaoConveniada",prioritaria,exibir_camera_ao_vivo AS "exibirCameraAoVivo",camera_url AS "cameraUrl",privado,invisivel,considerar_sabado AS "considerarSabado",considerar_domingo AS "considerarDomingo",seguir_automatico AS "seguirAutomatico",vincular_pagamento_percentual AS "vincularPagamentoPercentual",corresponsaveis_podem_editar AS "corresponsaveisPodemEditar",orgao_id AS "orgaoId",setor_id AS "setorId",localidade_id AS "localidadeId",subclassificacao_id AS "subclassificacaoId",eixo_id AS "eixoId",classificacao_id AS "classificacaoId",tipologia_id AS "tipologiaId",subtipologia_id AS "subtipologiaId",programa_ppa AS "programaPpa",acao_estrategica AS "acaoEstrategica",acao_orcamentaria AS "acaoOrcamentaria",unidade_medida AS "unidadeMedida",quantidade,secretario,data_pactuada AS "dataPactuada",criado_por_usuario_id AS "criadoPorUsuarioId",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt" FROM "${s}"."obras" WHERE id=$1 AND deleted_at IS NULL`,
        [id],
      );
      return right(r ? ObraMapper.toEntity(r as unknown as ObraModel & Record<string, unknown>) : null);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findOneWithRelations(id: string): AsyncResult<AppException, ObraEntity | null> {
    return this.findById(id);
  }

  async findPage(params: ObraFindPageParams): AsyncResult<AppException, PageEntity<ObraEntity>> {
    try {
      const s = this.tc.require().schemaName;
      const conditions: string[] = ['deleted_at IS NULL'];
      const values: unknown[] = [];
      let idx = 1;
      if (params.status) {
        conditions.push(`status = $${idx++}`);
        values.push(params.status);
      }
      if (params.tipo) {
        conditions.push(`tipo = $${idx++}`);
        values.push(params.tipo);
      }
      if (params.orgaoId) {
        conditions.push(`orgao_id = $${idx++}`);
        values.push(params.orgaoId);
      }
      if (params.q) {
        conditions.push(`(nome ILIKE $${idx} OR codigo ILIKE $${idx})`);
        values.push(`%${params.q}%`);
        idx++;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countSql = `SELECT COUNT(*)::int AS count FROM "${s}"."obras" ${where}`;
      const [countRow] = await this.ds.query<{ count: number }[]>(countSql, values);
      const itemCount = countRow?.count ?? 0;
      const dataSql = `SELECT id,codigo,nome,descricao,tipo,status,tipo_financiamento AS "tipoFinanciamento",modo_duracao AS "modoDuracao",data_inicio AS "dataInicio",data_prazo AS "dataPrazo",acao_conveniada AS "acaoConveniada",prioritaria,exibir_camera_ao_vivo AS "exibirCameraAoVivo",camera_url AS "cameraUrl",privado,invisivel,considerar_sabado AS "considerarSabado",considerar_domingo AS "considerarDomingo",seguir_automatico AS "seguirAutomatico",vincular_pagamento_percentual AS "vincularPagamentoPercentual",corresponsaveis_podem_editar AS "corresponsaveisPodemEditar",orgao_id AS "orgaoId",setor_id AS "setorId",localidade_id AS "localidadeId",subclassificacao_id AS "subclassificacaoId",eixo_id AS "eixoId",classificacao_id AS "classificacaoId",tipologia_id AS "tipologiaId",subtipologia_id AS "subtipologiaId",programa_ppa AS "programaPpa",acao_estrategica AS "acaoEstrategica",acao_orcamentaria AS "acaoOrcamentaria",unidade_medida AS "unidadeMedida",quantidade,secretario,data_pactuada AS "dataPactuada",criado_por_usuario_id AS "criadoPorUsuarioId",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt" FROM "${s}"."obras" ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
      const dataValues = [...values, params.pageOptions.take, params.pageOptions.skip];
      const rows = await this.ds.query<Record<string, unknown>[]>(dataSql, dataValues);
      const entities = rows.map((r) => ObraMapper.toEntity(r as unknown as ObraModel & Record<string, unknown>));
      const meta = new PageMetaEntity({ pageOptions: params.pageOptions, itemCount });
      return right(new PageEntity(entities, meta));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async updatePartial(entity: ObraEntity): AsyncResult<AppException, ObraEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = entity.toObject();
      const [updated] = await this.ds.query<Record<string, unknown>[]>(
        `UPDATE "${s}"."obras" SET nome=$1, descricao=$2, tipo=$3, status=$4, tipo_financiamento=$5, modo_duracao=$6, data_inicio=$7, data_prazo=$8, acao_conveniada=$9, prioritaria=$10, exibir_camera_ao_vivo=$11, camera_url=$12, privado=$13, invisivel=$14, considerar_sabado=$15, considerar_domingo=$16, seguir_automatico=$17, vincular_pagamento_percentual=$18, corresponsaveis_podem_editar=$19, orgao_id=$20, setor_id=$21, localidade_id=$22, subclassificacao_id=$23, eixo_id=$24, classificacao_id=$25, tipologia_id=$26, subtipologia_id=$27, programa_ppa=$28, acao_estrategica=$29, acao_orcamentaria=$30, unidade_medida=$31, quantidade=$32, secretario=$33, data_pactuada=$34, updated_at=$35 WHERE id=$36 AND deleted_at IS NULL RETURNING id,codigo,nome,descricao,tipo,status,tipo_financiamento AS "tipoFinanciamento",modo_duracao AS "modoDuracao",data_inicio AS "dataInicio",data_prazo AS "dataPrazo",acao_conveniada AS "acaoConveniada",prioritaria,exibir_camera_ao_vivo AS "exibirCameraAoVivo",camera_url AS "cameraUrl",privado,invisivel,considerar_sabado AS "considerarSabado",considerar_domingo AS "considerarDomingo",seguir_automatico AS "seguirAutomatico",vincular_pagamento_percentual AS "vincularPagamentoPercentual",corresponsaveis_podem_editar AS "corresponsaveisPodemEditar",orgao_id AS "orgaoId",setor_id AS "setorId",localidade_id AS "localidadeId",subclassificacao_id AS "subclassificacaoId",eixo_id AS "eixoId",classificacao_id AS "classificacaoId",tipologia_id AS "tipologiaId",subtipologia_id AS "subtipologiaId",programa_ppa AS "programaPpa",acao_estrategica AS "acaoEstrategica",acao_orcamentaria AS "acaoOrcamentaria",unidade_medida AS "unidadeMedida",quantidade,secretario,data_pactuada AS "dataPactuada",criado_por_usuario_id AS "criadoPorUsuarioId",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt"`,
        [
          o.nome,
          o.descricao,
          o.tipo,
          o.status,
          o.tipoFinanciamento,
          o.modoDuracao,
          o.dataInicio,
          o.dataPrazo,
          o.acaoConveniada,
          o.prioritaria,
          o.exibirCameraAoVivo,
          o.cameraUrl,
          o.privado,
          o.invisivel,
          o.considerarSabado,
          o.considerarDomingo,
          o.seguirAutomatico,
          o.vincularPagamentoPercentual,
          o.corresponsaveisPodemEditar,
          o.orgaoId,
          o.setorId,
          o.localidadeId,
          o.subclassificacaoId,
          o.eixoId,
          o.classificacaoId,
          o.tipologiaId,
          o.subtipologiaId,
          o.programaPpa,
          o.acaoEstrategica,
          o.acaoOrcamentaria,
          o.unidadeMedida,
          o.quantidade,
          o.secretario,
          o.dataPactuada,
          o.updatedAt,
          o.id,
        ],
      );
      if (!updated)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(ObraMapper.toEntity(updated as unknown as ObraModel & Record<string, unknown>));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async softDelete(id: string): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      await this.ds.query(`UPDATE "${s}"."obras" SET deleted_at = now(), updated_at = now() WHERE id=$1 AND deleted_at IS NULL`, [id]);
      return right(undefined);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

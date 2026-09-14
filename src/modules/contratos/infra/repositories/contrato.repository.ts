import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoMapper from '@/modules/contratos/infra/mapper/contrato.mapper';
export default class ContratoRepository implements IContratoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  async save(e: ContratoEntity): AsyncResult<AppException, ContratoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = e.toObject() as any;
      const [saved] = await this.ds.query(
        `INSERT INTO "${s}"."contrato" (id, tenant_id, obra_id, empresa_contratada_id, numero, objeto, data_assinatura, fim_vigencia, data_os, tipo_prazo_execucao, prazo_execucao_dias, prazo_execucao_data, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO UPDATE SET empresa_contratada_id=EXCLUDED.empresa_contratada_id, numero=EXCLUDED.numero, objeto=EXCLUDED.objeto, data_assinatura=EXCLUDED.data_assinatura, fim_vigencia=EXCLUDED.fim_vigencia, data_os=EXCLUDED.data_os, tipo_prazo_execucao=EXCLUDED.tipo_prazo_execucao, prazo_execucao_dias=EXCLUDED.prazo_execucao_dias, prazo_execucao_data=EXCLUDED.prazo_execucao_data, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id as "tenantId", obra_id as "obraId", empresa_contratada_id as "empresaContratadaId", numero, objeto, data_assinatura as "dataAssinatura", fim_vigencia as "fimVigencia", data_os as "dataOs", tipo_prazo_execucao as "tipoPrazoExecucao", prazo_execucao_dias as "prazoExecucaoDias", prazo_execucao_data as "prazoExecucaoData", created_at as "createdAt", updated_at as "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.obraId,
          o.empresaContratadaId,
          o.numero,
          o.objeto,
          o.dataAssinatura,
          o.fimVigencia,
          o.dataOs,
          o.tipoPrazoExecucao,
          o.prazoExecucaoDias,
          o.prazoExecucaoData,
          o.createdAt,
          o.updatedAt,
        ],
      );
      await this.ds.query(
        `DELETE FROM "${s}"."contrato_fonte" WHERE contrato_id=$1`,
        [o.id],
      );
      if (o.fontes?.length) {
        for (const f of o.fontes) {
          await this.ds.query(
            `INSERT INTO "${s}"."contrato_fonte" (id, tenant_id, contrato_id, fonte_id, valor, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
            [
              require('node:crypto').randomUUID(),
              this.tc.require().tenantId,
              o.id,
              f.fonteId,
              f.valor,
              new Date(),
            ],
          );
        }
      }
      return right(ContratoMapper.toEntity(saved));
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async findById(id: string): AsyncResult<AppException, ContratoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", obra_id as "obraId", empresa_contratada_id as "empresaContratadaId", numero, objeto, data_assinatura as "dataAssinatura", fim_vigencia as "fimVigencia", data_os as "dataOs", tipo_prazo_execucao as "tipoPrazoExecucao", prazo_execucao_dias as "prazoExecucaoDias", prazo_execucao_data as "prazoExecucaoData", created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."contrato" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      if (!row) return right(null);
      const fontes = await this.ds.query(
        `SELECT fonte_id as "fonteId", valor FROM "${s}"."contrato_fonte" WHERE contrato_id=$1`,
        [id],
      );
      row.fontes = fontes;
      return right(ContratoMapper.toEntity(row));
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async findPage(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<ContratoEntity>> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const totalRows = await this.ds.query(
        `SELECT COUNT(*) as count FROM "${s}"."contrato" WHERE tenant_id=$1`,
        [ctx.tenantId],
      );
      const total = Number(totalRows[0]?.count ?? 0);
      const rows = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", obra_id as "obraId", empresa_contratada_id as "empresaContratadaId", numero, objeto, data_assinatura as "dataAssinatura", fim_vigencia as "fimVigencia", data_os as "dataOs", tipo_prazo_execucao as "tipoPrazoExecucao", prazo_execucao_dias as "prazoExecucaoDias", prazo_execucao_data as "prazoExecucaoData", created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."contrato" WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [ctx.tenantId, pageOptions.take, pageOptions.skip],
      );
      const items: ContratoEntity[] = [];
      for (const row of rows) {
        row.fontes = await this.ds.query(
          `SELECT fonte_id as "fonteId", valor FROM "${s}"."contrato_fonte" WHERE contrato_id=$1`,
          [row.id],
        );
        items.push(ContratoMapper.toEntity(row));
      }
      const meta = new PageMetaEntity({ pageOptions, itemCount: total });
      return right(new PageEntity(items, meta));
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async findByObraSingle(
    obraId: string,
  ): AsyncResult<AppException, ContratoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query(
        `SELECT id FROM "${s}"."contrato" WHERE obra_id=$1 AND tenant_id=$2`,
        [obraId, ctx.tenantId],
      );
      if (!row) return right(null);
      return this.findById(row.id as string);
    } catch (cause) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async delete(id: string): AsyncResult<AppException, void> {
    try {
      const ctx = this.tc.require();
      await this.ds.query(
        `DELETE FROM "${ctx.schemaName}"."contrato" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      return right(undefined);
    } catch (cause) {
      return left(new ContratoRepositoryException({ code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
}

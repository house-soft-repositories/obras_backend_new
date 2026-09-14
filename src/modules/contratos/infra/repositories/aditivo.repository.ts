import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import AditivoRepositoryException from '@/modules/contratos/exceptions/aditivo_repository.exception';
export default class AditivoRepository implements IAditivoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  async save(e: AditivoEntity): AsyncResult<any, AditivoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = e.toObject() as any;
      const [saved] = await this.ds.query(
        `INSERT INTO "${s}"."aditivo" (id, tenant_id, contrato_id, numero, tipo, data_assinatura, tipo_prazo_execucao, prazo_execucao_dias, prazo_execucao_data, vigencia_aditivada, observacoes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (tenant_id, contrato_id, numero) DO UPDATE SET tipo=EXCLUDED.tipo, data_assinatura=EXCLUDED.data_assinatura, tipo_prazo_execucao=EXCLUDED.tipo_prazo_execucao, prazo_execucao_dias=EXCLUDED.prazo_execucao_dias, prazo_execucao_data=EXCLUDED.prazo_execucao_data, vigencia_aditivada=EXCLUDED.vigencia_aditivada, observacoes=EXCLUDED.observacoes, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id as "tenantId", contrato_id as "contratoId", numero, tipo, data_assinatura as "dataAssinatura", tipo_prazo_execucao as "tipoPrazoExecucao", prazo_execucao_dias as "prazoExecucaoDias", prazo_execucao_data as "prazoExecucaoData", vigencia_aditivada as "vigenciaAditivada", observacoes, created_at as "createdAt", updated_at as "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.contratoId,
          o.numero,
          o.tipo,
          o.dataAssinatura,
          o.tipoPrazoExecucao,
          o.prazoExecucaoDias,
          o.prazoExecucaoData,
          o.vigenciaAditivada,
          o.observacoes,
          o.createdAt,
          o.updatedAt,
        ],
      );
      if (!saved) {
        return left(
          new AditivoRepositoryException({
            code: ErrorCodeConstants.ADITIVO_DUPLICATE_NUMERO,
            statusCode: 409,
          } as any),
        );
      }
      return right(
        AditivoEntity.fromData({
          id: saved.id as string,
          tenantId: saved.tenantId as string,
          contratoId: saved.contratoId as string,
          numero: saved.numero as string,
          tipo: saved.tipo,
          dataAssinatura: (saved.dataAssinatura as string) ?? null,
          tipoPrazoExecucao: saved.tipoPrazoExecucao ?? null,
          prazoExecucaoDias: (saved.prazoExecucaoDias as number) ?? null,
          prazoExecucaoData: (saved.prazoExecucaoData as string) ?? null,
          vigenciaAditivada: (saved.vigenciaAditivada as string) ?? null,
          observacoes: (saved.observacoes as string) ?? null,
          fontes: o.fontes,
          createdAt: saved.createdAt as Date,
          updatedAt: saved.updatedAt as Date,
        }),
      );
    } catch (cause) {
      if ((cause as any)?.code === '23505')
        return left(
          new AditivoRepositoryException({
            code: ErrorCodeConstants.ADITIVO_DUPLICATE_NUMERO,
            statusCode: 409,
          } as any),
        );
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async listByContrato(contratoId: string): AsyncResult<any, AditivoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const rows = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", contrato_id as "contratoId", numero, tipo, data_assinatura as "dataAssinatura", tipo_prazo_execucao as "tipoPrazoExecucao", prazo_execucao_dias as "prazoExecucaoDias", prazo_execucao_data as "prazoExecucaoData", vigencia_aditivada as "vigenciaAditivada", observacoes, created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."aditivo" WHERE contrato_id=$1 AND tenant_id=$2 ORDER BY created_at ASC`,
        [contratoId, ctx.tenantId],
      );
      return right(
        rows.map((r: any) =>
          AditivoEntity.fromData({
            id: r.id,
            tenantId: r.tenantId,
            contratoId: r.contratoId,
            numero: r.numero,
            tipo: r.tipo,
            dataAssinatura: r.dataAssinatura,
            tipoPrazoExecucao: r.tipoPrazoExecucao,
            prazoExecucaoDias: r.prazoExecucaoDias,
            prazoExecucaoData: r.prazoExecucaoData,
            vigenciaAditivada: r.vigenciaAditivada,
            observacoes: r.observacoes,
            fontes: [],
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }),
        ),
      );
    } catch (cause) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async findById(id: string): AsyncResult<any, AditivoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", contrato_id as "contratoId", numero, tipo, data_assinatura as "dataAssinatura", tipo_prazo_execucao as "tipoPrazoExecucao", prazo_execucao_dias as "prazoExecucaoDias", prazo_execucao_data as "prazoExecucaoData", vigencia_aditivada as "vigenciaAditivada", observacoes, created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."aditivo" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      return right(
        row
          ? AditivoEntity.fromData({
              id: row.id,
              tenantId: row.tenantId,
              contratoId: row.contratoId,
              numero: row.numero,
              tipo: row.tipo,
              dataAssinatura: row.dataAssinatura,
              tipoPrazoExecucao: row.tipoPrazoExecucao,
              prazoExecucaoDias: row.prazoExecucaoDias,
              prazoExecucaoData: row.prazoExecucaoData,
              vigenciaAditivada: row.vigenciaAditivada,
              observacoes: row.observacoes,
              fontes: [],
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            })
          : null,
      );
    } catch (cause) {
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async delete(id: string): AsyncResult<any, true> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      await this.ds.query(`DELETE FROM "${s}"."aditivo" WHERE id=$1 AND tenant_id=$2`, [id, ctx.tenantId]);
      return right(true);
    } catch (cause) {
      return left(new AditivoRepositoryException({ code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED, statusCode: 500, cause } as any));
    }
  }
}

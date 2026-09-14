import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import ParalisacaoRepositoryException from '@/modules/contratos/exceptions/paralisacao_repository.exception';
export default class ParalisacaoRepository implements IParalisacaoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  async save(e: ParalisacaoEntity): AsyncResult<any, ParalisacaoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = e.toObject() as any;
      const [saved] = await this.ds.query(
        `INSERT INTO "${s}"."paralisacao" (id, tenant_id, contrato_id, data_paralisacao, motivo, termo_paralisacao_arquivo_id, data_reinicio, termo_retomada_arquivo_id, dias_parados, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET data_reinicio=EXCLUDED.data_reinicio, termo_retomada_arquivo_id=EXCLUDED.termo_retomada_arquivo_id, dias_parados=EXCLUDED.dias_parados, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id as "tenantId", contrato_id as "contratoId", data_paralisacao as "dataParalisacao", motivo, termo_paralisacao_arquivo_id as "termoParalisacaoArquivoId", data_reinicio as "dataReinicio", termo_retomada_arquivo_id as "termoRetomadaArquivoId", dias_parados as "diasParados", created_at as "createdAt", updated_at as "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.contratoId,
          o.dataParalisacao,
          o.motivo,
          o.termoParalisacaoArquivoId,
          o.dataReinicio,
          o.termoRetomadaArquivoId,
          o.diasParados,
          o.createdAt,
          o.updatedAt,
        ],
      );
      return right(
        ParalisacaoEntity.fromData({
          id: saved.id,
          tenantId: saved.tenantId,
          contratoId: saved.contratoId,
          dataParalisacao: saved.dataParalisacao,
          motivo: saved.motivo,
          termoParalisacaoArquivoId: saved.termoParalisacaoArquivoId,
          dataReinicio: saved.dataReinicio,
          termoRetomadaArquivoId: saved.termoRetomadaArquivoId,
          diasParados: saved.diasParados,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
        }),
      );
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async listByContrato(
    contratoId: string,
  ): AsyncResult<any, ParalisacaoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const rows = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", contrato_id as "contratoId", data_paralisacao as "dataParalisacao", motivo, termo_paralisacao_arquivo_id as "termoParalisacaoArquivoId", data_reinicio as "dataReinicio", termo_retomada_arquivo_id as "termoRetomadaArquivoId", dias_parados as "diasParados", created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."paralisacao" WHERE contrato_id=$1 AND tenant_id=$2 ORDER BY data_paralisacao ASC`,
        [contratoId, ctx.tenantId],
      );
      return right(
        rows.map((r: any) =>
          ParalisacaoEntity.fromData({
            id: r.id,
            tenantId: r.tenantId,
            contratoId: r.contratoId,
            dataParalisacao: r.dataParalisacao,
            motivo: r.motivo,
            termoParalisacaoArquivoId: r.termoParalisacaoArquivoId,
            dataReinicio: r.dataReinicio,
            termoRetomadaArquivoId: r.termoRetomadaArquivoId,
            diasParados: r.diasParados,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }),
        ),
      );
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async findById(id: string): AsyncResult<any, ParalisacaoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", contrato_id as "contratoId", data_paralisacao as "dataParalisacao", motivo, termo_paralisacao_arquivo_id as "termoParalisacaoArquivoId", data_reinicio as "dataReinicio", termo_retomada_arquivo_id as "termoRetomadaArquivoId", dias_parados as "diasParados", created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."paralisacao" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      return right(
        row
          ? ParalisacaoEntity.fromData({
              id: row.id,
              tenantId: row.tenantId,
              contratoId: row.contratoId,
              dataParalisacao: row.dataParalisacao,
              motivo: row.motivo,
              termoParalisacaoArquivoId: row.termoParalisacaoArquivoId,
              dataReinicio: row.dataReinicio,
              termoRetomadaArquivoId: row.termoRetomadaArquivoId,
              diasParados: row.diasParados,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            })
          : null,
      );
    } catch (cause) {
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
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
      await this.ds.query(`DELETE FROM "${s}"."paralisacao" WHERE id=$1 AND tenant_id=$2`, [id, ctx.tenantId]);
      return right(true);
    } catch (cause) {
      return left(new ParalisacaoRepositoryException({ code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED, statusCode: 500, cause } as any));
    }
  }
}

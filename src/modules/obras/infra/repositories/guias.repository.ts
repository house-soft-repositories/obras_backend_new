import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IGuiasRepository from '@/modules/obras/adapters/guias_repository.interface';
import {
  LicencaEntity,
  ObraLocalizacaoEntity,
  ObraOrcamentoPrevistoEntity,
  RecebimentoEntity,
  TitularidadeEntity,
} from '@/modules/obras/domain/entities/guias.entity';
import GuiaRepositoryException from '@/modules/obras/exceptions/guia_repository.exception';
import GuiasMapper from '@/modules/obras/infra/mapper/guias.mapper';
import { DataSource } from 'typeorm';

export default class GuiasRepository implements IGuiasRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private async assertObra(obraId: string): Promise<null | AppException> {
    const s = this.tc.require().schemaName;
    const rows = await this.ds.query<string[]>(
      `SELECT id FROM "${s}"."obras" WHERE id=$1 AND deleted_at IS NULL`,
      [obraId],
    );
    if (!rows.length)
      return new GuiaRepositoryException({
        code: ErrorCodeConstants.OBRA_NOT_FOUND,
        statusCode: 404,
      });
    return null;
  }

  async listLocalizacoes(
    obraId: string,
  ): AsyncResult<AppException, ObraLocalizacaoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", localidade, uf, latitude, longitude, created_at AS "createdAt" FROM "${s}"."obra_localizacao" WHERE obra_id=$1 ORDER BY localidade ASC`,
        [obraId],
      );
      return right(rows.map((r) => GuiasMapper.localizacaoToEntity(r)));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async saveLocalizacao(
    entity: ObraLocalizacaoEntity,
  ): AsyncResult<AppException, ObraLocalizacaoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(entity.obraId);
      if (err) return left(err);
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."obra_localizacao" (id, tenant_id, obra_id, localidade, uf, latitude, longitude, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING RETURNING id, tenant_id AS "tenantId", obra_id AS "obraId", localidade, uf, latitude, longitude, created_at AS "createdAt"`,
        [
          o.id,
          o.tenantId,
          o.obraId,
          o.localidade,
          o.uf,
          o.latitude,
          o.longitude,
          o.createdAt,
        ],
      );
      if (!saved) {
        const [row] = await this.ds.query<Record<string, unknown>[]>(
          `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", localidade, uf, latitude, longitude, created_at AS "createdAt" FROM "${s}"."obra_localizacao" WHERE id=$1`,
          [o.id],
        );
        return right(GuiasMapper.localizacaoToEntity(row));
      }
      return right(GuiasMapper.localizacaoToEntity(saved));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async deleteLocalizacao(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const res = await this.ds.query<unknown[]>(
        `DELETE FROM "${s}"."obra_localizacao" WHERE id=$1 AND obra_id=$2 RETURNING id`,
        [id, obraId],
      );
      if (!res.length)
        return left(
          new GuiaRepositoryException({
            code: ErrorCodeConstants.GUIA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(undefined);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listOrcamentos(
    obraId: string,
  ): AsyncResult<AppException, ObraOrcamentoPrevistoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", fonte_id AS "fonteId", valor, created_at AS "createdAt" FROM "${s}"."obra_orcamento_previsto" WHERE obra_id=$1 ORDER BY created_at ASC`,
        [obraId],
      );
      return right(rows.map((r) => GuiasMapper.orcamentoToEntity(r)));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async saveOrcamento(
    entity: ObraOrcamentoPrevistoEntity,
  ): AsyncResult<AppException, ObraOrcamentoPrevistoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(entity.obraId);
      if (err) return left(err);
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."obra_orcamento_previsto" (id, tenant_id, obra_id, fonte_id, valor, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING RETURNING id, tenant_id AS "tenantId", obra_id AS "obraId", fonte_id AS "fonteId", valor, created_at AS "createdAt"`,
        [o.id, o.tenantId, o.obraId, o.fonteId, o.valor, o.createdAt],
      );
      if (!saved) {
        const [row] = await this.ds.query<Record<string, unknown>[]>(
          `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", fonte_id AS "fonteId", valor, created_at AS "createdAt" FROM "${s}"."obra_orcamento_previsto" WHERE id=$1`,
          [o.id],
        );
        return right(GuiasMapper.orcamentoToEntity(row));
      }
      return right(GuiasMapper.orcamentoToEntity(saved));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async deleteOrcamento(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const res = await this.ds.query<unknown[]>(
        `DELETE FROM "${s}"."obra_orcamento_previsto" WHERE id=$1 AND obra_id=$2 RETURNING id`,
        [id, obraId],
      );
      if (!res.length)
        return left(
          new GuiaRepositoryException({
            code: ErrorCodeConstants.GUIA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(undefined);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async getTitularidade(
    obraId: string,
  ): AsyncResult<AppException, TitularidadeEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", situacao, tipo, observacoes, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."titularidade" WHERE obra_id=$1`,
        [obraId],
      );
      return right(row ? GuiasMapper.titularidadeToEntity(row) : null);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async upsertTitularidade(
    entity: TitularidadeEntity,
  ): AsyncResult<AppException, TitularidadeEntity> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(entity.obraId);
      if (err) return left(err);
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."titularidade" (id, tenant_id, obra_id, situacao, tipo, observacoes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (obra_id) DO UPDATE SET situacao=EXCLUDED.situacao, tipo=EXCLUDED.tipo, observacoes=EXCLUDED.observacoes, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id AS "tenantId", obra_id AS "obraId", situacao, tipo, observacoes, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.obraId,
          o.situacao,
          o.tipo,
          o.observacoes,
          o.createdAt,
          o.updatedAt,
        ],
      );
      return right(GuiasMapper.titularidadeToEntity(saved));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listLicencas(
    obraId: string,
  ): AsyncResult<AppException, LicencaEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", situacao, tipo, numero, validade, observacoes, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."licenca" WHERE obra_id=$1 ORDER BY created_at ASC`,
        [obraId],
      );
      return right(rows.map((r) => GuiasMapper.licencaToEntity(r)));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findLicenca(
    id: string,
  ): AsyncResult<AppException, LicencaEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", situacao, tipo, numero, validade, observacoes, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."licenca" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      return right(row ? GuiasMapper.licencaToEntity(row) : null);
    } catch (cause) {
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async saveLicenca(
    entity: LicencaEntity,
  ): AsyncResult<AppException, LicencaEntity> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(entity.obraId);
      if (err) return left(err);
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."licenca" (id, tenant_id, obra_id, situacao, tipo, numero, validade, observacoes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET situacao=EXCLUDED.situacao, tipo=EXCLUDED.tipo, numero=EXCLUDED.numero, validade=EXCLUDED.validade, observacoes=EXCLUDED.observacoes, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id AS "tenantId", obra_id AS "obraId", situacao, tipo, numero, validade, observacoes, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.obraId,
          o.situacao,
          o.tipo,
          o.numero,
          o.validade,
          o.observacoes,
          o.createdAt,
          o.updatedAt,
        ],
      );
      return right(GuiasMapper.licencaToEntity(saved));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async deleteLicenca(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const res = await this.ds.query<unknown[]>(
        `DELETE FROM "${s}"."licenca" WHERE id=$1 AND obra_id=$2 RETURNING id`,
        [id, obraId],
      );
      if (!res.length)
        return left(
          new GuiaRepositoryException({
            code: ErrorCodeConstants.LICENCA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(undefined);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listRecebimentos(
    obraId: string,
  ): AsyncResult<AppException, RecebimentoEntity[]> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const rows = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", tipo, data, data_prevista AS "dataPrevista", created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."recebimento" WHERE obra_id=$1 ORDER BY created_at ASC`,
        [obraId],
      );
      return right(rows.map((r) => GuiasMapper.recebimentoToEntity(r)));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findRecebimento(
    id: string,
  ): AsyncResult<AppException, RecebimentoEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query<Record<string, unknown>[]>(
        `SELECT id, tenant_id AS "tenantId", obra_id AS "obraId", tipo, data, data_prevista AS "dataPrevista", created_at AS "createdAt", updated_at AS "updatedAt" FROM "${s}"."recebimento" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      return right(row ? GuiasMapper.recebimentoToEntity(row) : null);
    } catch (cause) {
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async saveRecebimento(
    entity: RecebimentoEntity,
  ): AsyncResult<AppException, RecebimentoEntity> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(entity.obraId);
      if (err) return left(err);
      const o = entity.toObject();
      const [saved] = await this.ds.query<Record<string, unknown>[]>(
        `INSERT INTO "${s}"."recebimento" (id, tenant_id, obra_id, tipo, data, data_prevista, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET tipo=EXCLUDED.tipo, data=EXCLUDED.data, data_prevista=EXCLUDED.data_prevista, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id AS "tenantId", obra_id AS "obraId", tipo, data, data_prevista AS "dataPrevista", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.obraId,
          o.tipo,
          o.data,
          o.dataPrevista,
          o.createdAt,
          o.updatedAt,
        ],
      );
      return right(GuiasMapper.recebimentoToEntity(saved));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async deleteRecebimento(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, void> {
    try {
      const s = this.tc.require().schemaName;
      const err = await this.assertObra(obraId);
      if (err) return left(err);
      const res = await this.ds.query<unknown[]>(
        `DELETE FROM "${s}"."recebimento" WHERE id=$1 AND obra_id=$2 RETURNING id`,
        [id, obraId],
      );
      if (!res.length)
        return left(
          new GuiaRepositoryException({
            code: ErrorCodeConstants.RECEBIMENTO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(undefined);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new GuiaRepositoryException({
          code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

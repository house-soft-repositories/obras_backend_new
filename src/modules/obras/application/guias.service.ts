import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import TenantContext from '@/core/multitenancy/tenant_context';
import IGuiasRepository from '@/modules/obras/adapters/guias_repository.interface';
import { LicencaEntity, ObraLocalizacaoEntity, ObraOrcamentoPrevistoEntity, RecebimentoEntity, TitularidadeEntity } from '@/modules/obras/domain/entities/guias.entity';
import { SituacaoTitularidade } from '@/modules/obras/domain/enums/situacao_titularidade.enum';
import { SituacaoLicenca } from '@/modules/obras/domain/enums/situacao_licenca.enum';
import { TipoRecebimento } from '@/modules/obras/domain/enums/tipo_recebimento.enum';
import GuiaRepositoryException from '@/modules/obras/exceptions/guia_repository.exception';
import GuiaServiceException from '@/modules/obras/exceptions/guia_service.exception';
import { DataSource } from 'typeorm';

export default class GuiasService {
  constructor(private readonly repo: IGuiasRepository, private readonly ds: DataSource, private readonly tc: TenantContext) {}

  async listLocalizacoes(obraId: string): AsyncResult<AppException, ObraLocalizacaoEntity[]> { return this.repo.listLocalizacoes(obraId); }

  async createLocalizacao(param: { obraId: string; localidade: string; uf: string; latitude?: string | null; longitude?: string | null }): AsyncResult<AppException, ObraLocalizacaoEntity> {
    try {
      const ctx = this.tc.require();
      const entity = ObraLocalizacaoEntity.create({ tenantId: ctx.tenantId, obraId: param.obraId, localidade: param.localidade, uf: param.uf, latitude: param.latitude ?? null, longitude: param.longitude ?? null });
      return this.repo.saveLocalizacao(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async deleteLocalizacao(obraId: string, id: string): AsyncResult<AppException, void> { return this.repo.deleteLocalizacao(obraId, id); }

  async listOrcamentos(obraId: string): AsyncResult<AppException, ObraOrcamentoPrevistoEntity[]> { return this.repo.listOrcamentos(obraId); }

  async createOrcamento(param: { obraId: string; fonteId: string; valor: string }): AsyncResult<AppException, ObraOrcamentoPrevistoEntity> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const fonte = await this.ds.query(`SELECT id FROM "${schema}"."fontes" WHERE id=$1 AND tenant_id=$2`, [param.fonteId, ctx.tenantId]);
      if (!fonte.length) return left(new GuiaRepositoryException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 422 }));
      const entity = ObraOrcamentoPrevistoEntity.create({ tenantId: ctx.tenantId, obraId: param.obraId, fonteId: param.fonteId, valor: param.valor });
      return this.repo.saveOrcamento(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async deleteOrcamento(obraId: string, id: string): AsyncResult<AppException, void> { return this.repo.deleteOrcamento(obraId, id); }

  async getTitularidade(obraId: string): AsyncResult<AppException, TitularidadeEntity | null> { return this.repo.getTitularidade(obraId); }

  async upsertTitularidade(param: { obraId: string; situacao: string; tipo?: string | null; observacoes?: string | null }): AsyncResult<AppException, TitularidadeEntity> {
    try {
      const ctx = this.tc.require();
      if (!Object.values(SituacaoTitularidade).includes(param.situacao as SituacaoTitularidade)) return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM, statusCode: 400 }));
      const existing = await this.repo.getTitularidade(param.obraId);
      if (existing.isLeft()) return left(existing.value);
      if (existing.value) {
        existing.value.update({ situacao: param.situacao as SituacaoTitularidade, tipo: param.tipo ?? null, observacoes: param.observacoes ?? null });
        return this.repo.upsertTitularidade(existing.value);
      }
      const entity = TitularidadeEntity.create({ tenantId: ctx.tenantId, obraId: param.obraId, situacao: param.situacao as SituacaoTitularidade, tipo: param.tipo ?? null, observacoes: param.observacoes ?? null });
      return this.repo.upsertTitularidade(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async listLicencas(obraId: string): AsyncResult<AppException, LicencaEntity[]> { return this.repo.listLicencas(obraId); }

  async createLicenca(param: { obraId: string; situacao: string; tipo?: string | null; numero?: string | null; validade?: string | null; observacoes?: string | null }): AsyncResult<AppException, LicencaEntity> {
    try {
      const ctx = this.tc.require();
      if (!Object.values(SituacaoLicenca).includes(param.situacao as SituacaoLicenca)) return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM, statusCode: 400 }));
      const entity = LicencaEntity.create({ tenantId: ctx.tenantId, obraId: param.obraId, situacao: param.situacao as SituacaoLicenca, tipo: param.tipo ?? null, numero: param.numero ?? null, validade: param.validade ?? null, observacoes: param.observacoes ?? null });
      return this.repo.saveLicenca(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async updateLicenca(param: { id: string; situacao?: string; tipo?: string | null; numero?: string | null; validade?: string | null; observacoes?: string | null }): AsyncResult<AppException, LicencaEntity> {
    try {
      if (param.situacao && !Object.values(SituacaoLicenca).includes(param.situacao as SituacaoLicenca)) return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM, statusCode: 400 }));
      const found = await this.repo.findLicenca(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return left(new GuiaRepositoryException({ code: ErrorCodeConstants.LICENCA_NOT_FOUND, statusCode: 404 }));
      found.value.update({ situacao: param.situacao as SituacaoLicenca | undefined, tipo: param.tipo, numero: param.numero, validade: param.validade, observacoes: param.observacoes });
      return this.repo.saveLicenca(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async deleteLicenca(obraId: string, id: string): AsyncResult<AppException, void> { return this.repo.deleteLicenca(obraId, id); }

  async listRecebimentos(obraId: string): AsyncResult<AppException, RecebimentoEntity[]> { return this.repo.listRecebimentos(obraId); }

  async createRecebimento(param: { obraId: string; tipo: string; data?: string | null; dataPrevista?: string | null }): AsyncResult<AppException, RecebimentoEntity> {
    try {
      const ctx = this.tc.require();
      if (!Object.values(TipoRecebimento).includes(param.tipo as TipoRecebimento)) return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM, statusCode: 400 }));
      const entity = RecebimentoEntity.create({ tenantId: ctx.tenantId, obraId: param.obraId, tipo: param.tipo as TipoRecebimento, data: param.data ?? null, dataPrevista: param.dataPrevista ?? null });
      return this.repo.saveRecebimento(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async updateRecebimento(param: { id: string; tipo?: string; data?: string | null; dataPrevista?: string | null }): AsyncResult<AppException, RecebimentoEntity> {
    try {
      if (param.tipo && !Object.values(TipoRecebimento).includes(param.tipo as TipoRecebimento)) return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_INVALID_ENUM, statusCode: 400 }));
      const found = await this.repo.findRecebimento(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return left(new GuiaRepositoryException({ code: ErrorCodeConstants.RECEBIMENTO_NOT_FOUND, statusCode: 404 }));
      found.value.update({ tipo: param.tipo as TipoRecebimento | undefined, data: param.data, dataPrevista: param.dataPrevista });
      return this.repo.saveRecebimento(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new GuiaServiceException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async deleteRecebimento(obraId: string, id: string): AsyncResult<AppException, void> { return this.repo.deleteRecebimento(obraId, id); }
}

import type AppException from '@/core/exceptions/app_exception';
import type AsyncResult from '@/core/types/async_result';
import type { LicencaEntity, ObraLocalizacaoEntity, ObraOrcamentoPrevistoEntity, RecebimentoEntity, TitularidadeEntity } from '@/modules/obras/domain/entities/guias.entity';

export default interface IGuiasUseCase {
  listLocalizacoes(obraId: string): AsyncResult<AppException, ObraLocalizacaoEntity[]>;
  createLocalizacao(param: { obraId: string; localidade: string; uf: string; latitude?: string | null; longitude?: string | null }): AsyncResult<AppException, ObraLocalizacaoEntity>;
  deleteLocalizacao(obraId: string, id: string): AsyncResult<AppException, void>;

  listOrcamentos(obraId: string): AsyncResult<AppException, ObraOrcamentoPrevistoEntity[]>;
  createOrcamento(param: { obraId: string; fonteId: string; valor: string }): AsyncResult<AppException, ObraOrcamentoPrevistoEntity>;
  deleteOrcamento(obraId: string, id: string): AsyncResult<AppException, void>;

  getTitularidade(obraId: string): AsyncResult<AppException, TitularidadeEntity | null>;
  upsertTitularidade(param: { obraId: string; situacao: string; tipo?: string | null; observacoes?: string | null }): AsyncResult<AppException, TitularidadeEntity>;

  listLicencas(obraId: string): AsyncResult<AppException, LicencaEntity[]>;
  createLicenca(param: { obraId: string; situacao: string; tipo?: string | null; numero?: string | null; validade?: string | null; observacoes?: string | null }): AsyncResult<AppException, LicencaEntity>;
  updateLicenca(param: { id: string; situacao?: string; tipo?: string | null; numero?: string | null; validade?: string | null; observacoes?: string | null }): AsyncResult<AppException, LicencaEntity>;
  deleteLicenca(obraId: string, id: string): AsyncResult<AppException, void>;

  listRecebimentos(obraId: string): AsyncResult<AppException, RecebimentoEntity[]>;
  createRecebimento(param: { obraId: string; tipo: string; data?: string | null; dataPrevista?: string | null }): AsyncResult<AppException, RecebimentoEntity>;
  updateRecebimento(param: { id: string; tipo?: string; data?: string | null; dataPrevista?: string | null }): AsyncResult<AppException, RecebimentoEntity>;
  deleteRecebimento(obraId: string, id: string): AsyncResult<AppException, void>;
}

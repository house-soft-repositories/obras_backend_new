import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { LicencaEntity, ObraLocalizacaoEntity, ObraOrcamentoPrevistoEntity, RecebimentoEntity, TitularidadeEntity } from '@/modules/obras/domain/entities/guias.entity';

export default interface IGuiasRepository {
  listLocalizacoes(obraId: string): AsyncResult<AppException, ObraLocalizacaoEntity[]>;
  saveLocalizacao(entity: ObraLocalizacaoEntity): AsyncResult<AppException, ObraLocalizacaoEntity>;
  deleteLocalizacao(obraId: string, id: string): AsyncResult<AppException, void>;

  listOrcamentos(obraId: string): AsyncResult<AppException, ObraOrcamentoPrevistoEntity[]>;
  saveOrcamento(entity: ObraOrcamentoPrevistoEntity): AsyncResult<AppException, ObraOrcamentoPrevistoEntity>;
  deleteOrcamento(obraId: string, id: string): AsyncResult<AppException, void>;

  getTitularidade(obraId: string): AsyncResult<AppException, TitularidadeEntity | null>;
  upsertTitularidade(entity: TitularidadeEntity): AsyncResult<AppException, TitularidadeEntity>;

  listLicencas(obraId: string): AsyncResult<AppException, LicencaEntity[]>;
  findLicenca(id: string): AsyncResult<AppException, LicencaEntity | null>;
  saveLicenca(entity: LicencaEntity): AsyncResult<AppException, LicencaEntity>;
  deleteLicenca(obraId: string, id: string): AsyncResult<AppException, void>;

  listRecebimentos(obraId: string): AsyncResult<AppException, RecebimentoEntity[]>;
  findRecebimento(id: string): AsyncResult<AppException, RecebimentoEntity | null>;
  saveRecebimento(entity: RecebimentoEntity): AsyncResult<AppException, RecebimentoEntity>;
  deleteRecebimento(obraId: string, id: string): AsyncResult<AppException, void>;
}

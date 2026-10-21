import BaseMapper from '@/core/types/base_mapper';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import MedicaoModel from '@/modules/cronograma/infra/models/medicao.model';
import MedicaoFonteModel from '@/modules/cronograma/infra/models/medicao_fonte.model';

export default abstract class MedicaoMapper extends BaseMapper<
  MedicaoEntity,
  MedicaoModel
> {
  static toEntity(m: MedicaoModel, fontes: MedicaoFonteModel[]): MedicaoEntity {
    return MedicaoEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      obraId: m.obraId,
      orgaoId: m.orgaoId,
      numero: m.numero,
      tipo: m.tipo,
      dataMedicao: m.data,
      observacao: m.observacao,
      criadoEm: m.createdAt,
      atualizadoEm: m.updatedAt,
      itens: fontes.map((fonte) => ({
        id: fonte.id,
        tenantId: fonte.tenantId,
        medicaoId: fonte.medicaoId,
        fonteId: fonte.fonteId,
        valor: Number(fonte.valor),
      })),
    });
  }

  static toModel(e: MedicaoEntity): Partial<MedicaoModel> {
    return {
      id: e.id,
      tenantId: e.tenantId,
      obraId: e.obraId,
      orgaoId: e.orgaoId,
      numero: e.numero,
      tipo: e.tipo,
      data: e.dataMedicao,
      observacao: e.observacao,
    };
  }
}

import MedicaoEntity, {
  MedicaoFonteProps,
} from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';

export type MedicaoRow = {
  id: string;
  tenant_id: string;
  obra_id: string;
  orgao_id?: string | null;
  numero: number | string;
  tipo: string;
  data: string;
  observacao: string | null;
  criado_em: Date;
  atualizado_em?: Date | null;
};

export type MedicaoFonteRow = {
  id: string;
  tenant_id: string;
  medicao_id: string;
  fonte_id: string;
  valor: number | string;
};

export default abstract class MedicaoMapper {
  static toEntity(
    row: MedicaoRow,
    fontes: MedicaoFonteRow[] = [],
  ): MedicaoEntity {
    return MedicaoEntity.fromData({
      id: row.id,
      tenantId: row.tenant_id,
      obraId: row.obra_id,
      orgaoId: row.orgao_id ?? null,
      numero: Number(row.numero),
      tipo: row.tipo as TipoMedicao,
      dataMedicao: row.data,
      observacao: row.observacao,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em ?? row.criado_em,
      itens: fontes.map((fonte) => MedicaoMapper.toFonte(fonte)),
    });
  }

  static toFonte(row: MedicaoFonteRow): MedicaoFonteProps {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      medicaoId: row.medicao_id,
      fonteId: row.fonte_id,
      valor: Number(row.valor),
    };
  }
}

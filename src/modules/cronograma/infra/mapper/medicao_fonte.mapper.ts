import MedicaoFonteModel from '@/modules/cronograma/infra/models/medicao_fonte.model';
import BaseMapper from '@/core/types/base_mapper';

export interface MedicaoFonteProps {
  id: string;
  tenantId: string;
  medicaoId: string;
  fonteId: string;
  valor: number;
}

export default abstract class MedicaoFonteMapper extends BaseMapper<MedicaoFonteProps, MedicaoFonteModel> {
  static toEntity(m: MedicaoFonteModel): MedicaoFonteProps {
    return {
      id: m.id,
      tenantId: m.tenantId,
      medicaoId: m.medicaoId,
      fonteId: m.fonteId,
      valor: Number(m.valor),
    };
  }

  static toModel(props: MedicaoFonteProps): Partial<MedicaoFonteModel> {
    return {
      id: props.id,
      tenantId: props.tenantId,
      medicaoId: props.medicaoId,
      fonteId: props.fonteId,
      valor: props.valor,
    };
  }
}

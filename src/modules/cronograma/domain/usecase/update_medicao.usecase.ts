import type UseCase from '@/core/types/use_case';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';

export interface UpdateMedicaoParam {
  obraId: string;
  id: string;
  numero?: number;
  tipo?: TipoMedicao;
  dataMedicao?: string;
  orgaoId?: string;
  observacoes?: string;
  fontes?: { fonteId: string; valor: number }[];
}

type IUpdateMedicaoUseCase = UseCase<UpdateMedicaoParam, MedicaoEntity>;
export default IUpdateMedicaoUseCase;
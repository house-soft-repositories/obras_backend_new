import type UseCase from '@/core/types/use_case';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';

export interface GetMedicaoParam {
  obraId: string;
  id: string;
}

type IGetMedicaoUseCase = UseCase<GetMedicaoParam, MedicaoEntity>;
export default IGetMedicaoUseCase;
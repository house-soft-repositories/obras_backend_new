import type UseCase from '@/core/types/use_case';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';

export interface GetContratoParam {
  id: string;
}

type IGetContratoUseCase = UseCase<GetContratoParam, ContratoEntity>;

export default IGetContratoUseCase;

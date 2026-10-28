import type UseCase from '@/core/types/use_case';
import ObraDetailReadModel from '@/modules/obras/domain/read-models/obra_detail.read-model';

export interface GetObraParam {
  id: string;
}

export class GetObraResponse {
  constructor(private readonly readModel: ObraDetailReadModel) {}

  fromResponse() {
    const obra = this.readModel.obra.toObject();
    return {
      ...obra,
      createdAt: obra.createdAt.toISOString(),
      updatedAt: obra.updatedAt.toISOString(),
      deletedAt: obra.deletedAt?.toISOString() ?? null,
      responsavel: this.readModel.responsavel,
    };
  }
}

type IGetObraUseCase = UseCase<GetObraParam, GetObraResponse>;
export default IGetObraUseCase;

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import IGetContratoUseCase, {
  GetContratoParam,
} from '@/modules/contratos/domain/usecase/get_contrato.usecase';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';

export default class GetContratoService implements IGetContratoUseCase {
  constructor(private readonly contratoRepo: IContratoRepository) {}

  async execute(
    param: GetContratoParam,
  ): AsyncResult<AppException, ContratoEntity> {
    const res = await this.contratoRepo.findById(param.id);
    if (res.isLeft()) return left(res.value);
    if (!res.value) {
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(res.value);
  }
}

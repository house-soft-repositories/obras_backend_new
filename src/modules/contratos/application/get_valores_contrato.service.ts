import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IGetValoresContratoUseCase, {
  GetValoresContratoParam,
  ValoresContratoResult,
} from '@/modules/contratos/domain/usecase/get_valores_contrato.usecase';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoServiceException from '@/modules/contratos/exceptions/contrato_service.exception';

export default class GetValoresContratoService
  implements IGetValoresContratoUseCase
{
  constructor(
    private readonly contratoRepo: IContratoRepository,
    private readonly aditivoRepo: IAditivoRepository,
  ) {}

  async execute(
    param: GetValoresContratoParam,
  ): AsyncResult<AppException, ValoresContratoResult> {
    try {
      const contratoRes = await this.contratoRepo.findById(param.id);
      if (contratoRes.isLeft()) return left(contratoRes.value);
      if (!contratoRes.value) {
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      const contrato = contratoRes.value;

      const valorOriginal = contrato.fontes
        .reduce((sum, f) => sum + Number(f.valor), 0)
        .toFixed(2);

      const aditivosRes = await this.aditivoRepo.listByContrato(param.id);
      let valorAditivos = 0;
      if (aditivosRes.isRight()) {
        for (const a of aditivosRes.value) {
          for (const f of a.fontes) valorAditivos += Number(f.valor);
        }
      }

      const total = (Number(valorOriginal) + valorAditivos).toFixed(2);

      return right({
        valorOriginal,
        valorAditivos: valorAditivos.toFixed(2),
        valorTotal: total,
      });
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ContratoServiceException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

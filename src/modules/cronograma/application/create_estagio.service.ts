import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import TenantContext from '@/core/multitenancy/tenant_context';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import ICreateEstagioUseCase, {
  CreateEstagioParam,
} from '@/modules/cronograma/domain/usecase/create_estagio.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class CreateEstagioService implements ICreateEstagioUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly tenantContext: TenantContext,
    private readonly obras: IObraRepository,
  ) {}

  async execute(
    param: CreateEstagioParam,
  ): AsyncResult<AppException, EstagioEntity> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    if (param.estagioPaiId) {
      const parent = await this.repository.findById(
        param.estagioPaiId,
        param.obraId,
      );
      if (parent.isLeft()) return left(parent.value);
      if (parent.value.estagioPaiId !== null)
        return left(
          new CronogramaServiceException({
            code: ErrorCodeConstants.CRONOGRAMA_ESTAGIO_PAI_INVALID,
            statusCode: 400,
          }),
        );
    }
    try {
      return this.repository.save(
        EstagioEntity.create({
          tenantId: this.tenantContext.require().tenantId,
          obraId: param.obraId,
          nome: param.nome,
          posicao: param.posicao ?? 0,
          dataInicio: param.dataInicio,
          dataFim: param.dataFim,
          responsavelUsuarioId: param.responsavelUsuarioId,
          estagioPaiId: param.estagioPaiId,
        }),
      );
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_SERVICE_FAILED,
          cause: error,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import TenantContext from '@/core/multitenancy/tenant_context';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import ICreateEstagiosLoteUseCase, { CreateEstagiosLoteParam } from '@/modules/cronograma/domain/usecase/create_estagios_lote.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

export default class CreateEstagiosLoteService implements ICreateEstagiosLoteUseCase {
  constructor(
    private readonly repository: IEstagioRepository,
    private readonly tenantContext: TenantContext,
    private readonly obras: IObraRepository,
  ) {}

  async execute(
    param: CreateEstagiosLoteParam,
  ): AsyncResult<AppException, EstagioEntity[]> {
    const obra = await this.obras.findById(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    for (const item of param.itens) {
      if (!item.estagioPaiId) continue;
      const parent = await this.repository.findById(item.estagioPaiId, param.obraId);
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
      const tenantId = this.tenantContext.require().tenantId;
      return this.repository.saveMany(
        param.itens.map((item, index) =>
          EstagioEntity.create({
            tenantId,
            obraId: param.obraId,
            nome: item.nome,
            posicao: item.posicao ?? index,
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            responsavelUsuarioId: item.responsavelUsuarioId,
            estagioPaiId: item.estagioPaiId,
          }),
        ),
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

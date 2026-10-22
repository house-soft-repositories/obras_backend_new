import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IUpdateAditivoUseCase, {
  UpdateAditivoParam,
} from '@/modules/contratos/domain/usecase/update_aditivo.usecase';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import AditivoRepositoryException from '@/modules/contratos/exceptions/aditivo_repository.exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class UpdateAditivoService implements IUpdateAditivoUseCase {
  constructor(private readonly repo: IAditivoRepository) {}

  async execute(
    param: UpdateAditivoParam,
  ): AsyncResult<AppException, AditivoEntity> {
    try {
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new AditivoRepositoryException({
            code: ErrorCodeConstants.ADITIVO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const entity = found.value;
      const updateData = entity.toObject();
      if (param.numero !== undefined) updateData.numero = param.numero;
      if (param.tipo !== undefined) updateData.tipo = param.tipo;
      if (param.dataAssinatura !== undefined)
        updateData.dataAssinatura = param.dataAssinatura;
      if (param.tipoPrazoExecucao !== undefined)
        updateData.tipoPrazoExecucao = param.tipoPrazoExecucao;
      if (param.prazoExecucaoDias !== undefined)
        updateData.prazoExecucaoDias = param.prazoExecucaoDias;
      if (param.prazoExecucaoData !== undefined)
        updateData.prazoExecucaoData = param.prazoExecucaoData;
      if (param.vigenciaAditivada !== undefined)
        updateData.vigenciaAditivada = param.vigenciaAditivada;
      if (param.observacoes !== undefined)
        updateData.observacoes = param.observacoes;
      if (param.fontes !== undefined) updateData.fontes = param.fontes;
      updateData.updatedAt = new Date();
      AditivoEntity.validate(updateData);
      const updated = AditivoEntity.fromData(updateData);
      const saved = await this.repo.save(updated);
      if (saved.isLeft()) return left(saved.value);
      return right(saved.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new AditivoRepositoryException({
          code: ErrorCodeConstants.ADITIVO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import { denyUnlessWriter } from '@/modules/localidades/application/localidade_authorization';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import IUpdateLocalidadeUseCase, {
  UpdateLocalidadeParam,
} from '@/modules/localidades/domain/usecase/update_localidade.usecase';
import LocalidadeDomainException from '@/modules/localidades/exceptions/localidade_domain.exception';
import LocalidadeServiceException from '@/modules/localidades/exceptions/localidade_service.exception';

export default class UpdateLocalidadeService implements IUpdateLocalidadeUseCase {
  constructor(private readonly repository: ILocalidadeRepository) {}

  async execute(
    param: UpdateLocalidadeParam,
  ): AsyncResult<AppException, LocalidadeEntity> {
    try {
      const denied = denyUnlessWriter(param.role);
      if (denied) return left(denied);
      const current = await this.repository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      return this.repository.save(
        current.value.update({
          nome: param.nome,
          uf: param.uf,
          codigoIbge: param.codigoIbge,
          tipo: param.tipo,
          municipio: param.municipio,
          observacoes: param.observacoes,
        }),
      );
    } catch (error) {
      if (error instanceof LocalidadeDomainException) return left(error);
      return left(
        new LocalidadeServiceException({
          code: ErrorCodeConstants.LOCALIDADE_UPDATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import ICreateLocalidadeUseCase, {
  CreateLocalidadeParam,
} from '@/modules/localidades/domain/usecase/create_localidade.usecase';
import LocalidadeDomainException from '@/modules/localidades/exceptions/localidade_domain.exception';
import LocalidadeServiceException from '@/modules/localidades/exceptions/localidade_service.exception';

export default class CreateLocalidadeService implements ICreateLocalidadeUseCase {
  constructor(private readonly repository: ILocalidadeRepository) {}

  async execute(
    param: CreateLocalidadeParam,
  ): AsyncResult<AppException, LocalidadeEntity> {
    try {
      return this.repository.save(
        LocalidadeEntity.create({
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
          code: ErrorCodeConstants.LOCALIDADE_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

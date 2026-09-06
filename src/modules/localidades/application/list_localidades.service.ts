import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import { denyUnlessReader } from '@/modules/localidades/application/localidade_authorization';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import IListLocalidadesUseCase, {
  ListLocalidadesParam,
} from '@/modules/localidades/domain/usecase/list_localidades.usecase';

export default class ListLocalidadesService implements IListLocalidadesUseCase {
  constructor(private readonly repository: ILocalidadeRepository) {}

  async execute(
    param: ListLocalidadesParam,
  ): AsyncResult<AppException, LocalidadeEntity[]> {
    const denied = denyUnlessReader(param.role);
    if (denied) return left(denied);
    return this.repository.findAll();
  }
}

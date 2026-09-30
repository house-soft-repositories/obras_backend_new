import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import IUpdateProfissionalTecnicoUseCase, {
  UpdateProfissionalTecnicoParam,
} from '@/modules/pessoas/domain/usecase/update_profissional_tecnico.usecase';
import ProfissionalTecnicoDomainException from '@/modules/pessoas/exceptions/profissional_tecnico_domain.exception';
import ProfissionalTecnicoServiceException from '@/modules/pessoas/exceptions/profissional_tecnico_service.exception';

export default class UpdateProfissionalTecnicoService
  implements IUpdateProfissionalTecnicoUseCase
{
  constructor(private readonly repository: IProfissionalTecnicoRepository) {}

  async execute(
    param: UpdateProfissionalTecnicoParam,
  ): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps> {
    try {
      const found = await this.repository.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return left(this.notFound());

      const saved = await this.repository.save(found.value.update(param.data));
      if (saved.isLeft()) return left(saved.value);

      const view = await this.repository.findViewById(saved.value.id);
      if (view.isLeft()) return left(view.value);
      if (!view.value) return left(this.notFound());
      return right(view.value);
    } catch (error) {
      if (error instanceof ProfissionalTecnicoDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ProfissionalTecnicoServiceException({
          code: ErrorCodeConstants.PROFISSIONAL_TECNICO_UPDATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private notFound(): ProfissionalTecnicoServiceException {
    return new ProfissionalTecnicoServiceException({
      code: ErrorCodeConstants.PROFISSIONAL_TECNICO_NOT_FOUND,
      statusCode: 404,
    });
  }
}

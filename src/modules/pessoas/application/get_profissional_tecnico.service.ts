import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import IGetProfissionalTecnicoUseCase, {
  GetProfissionalTecnicoParam,
} from '@/modules/pessoas/domain/usecase/get_profissional_tecnico.usecase';
import ProfissionalTecnicoServiceException from '@/modules/pessoas/exceptions/profissional_tecnico_service.exception';

export default class GetProfissionalTecnicoService
  implements IGetProfissionalTecnicoUseCase
{
  constructor(private readonly repository: IProfissionalTecnicoRepository) {}

  async execute(
    param: GetProfissionalTecnicoParam,
  ): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps> {
    try {
      const found = await this.repository.findViewById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return left(this.notFound());
      return right(found.value);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ProfissionalTecnicoServiceException({
          code: ErrorCodeConstants.PROFISSIONAL_TECNICO_REPOSITORY_FAILED,
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

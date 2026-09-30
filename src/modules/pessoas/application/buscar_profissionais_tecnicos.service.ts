import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import IBuscarProfissionaisTecnicosUseCase, {
  BuscarProfissionaisTecnicosParam,
} from '@/modules/pessoas/domain/usecase/buscar_profissionais_tecnicos.usecase';
import ProfissionalTecnicoServiceException from '@/modules/pessoas/exceptions/profissional_tecnico_service.exception';

export default class BuscarProfissionaisTecnicosService
  implements IBuscarProfissionaisTecnicosUseCase
{
  constructor(private readonly repository: IProfissionalTecnicoRepository) {}

  async execute(
    param: BuscarProfissionaisTecnicosParam,
  ): AsyncResult<AppException, PageEntity<ProfissionalTecnicoComPessoaProps>> {
    try {
      const query = param.q?.trim() ?? '';
      if (query.length < 3) {
        return left(
          new ProfissionalTecnicoServiceException({
            code: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_BUSCA,
            statusCode: 400,
          }),
        );
      }
      const take = Math.min(param.take ?? 10, 25);
      return this.repository.searchViews(
        new PageOptionsEntity(param.order, param.page, take),
        query,
      );
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
}

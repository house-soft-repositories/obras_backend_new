import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import ProfissionalTecnicoEntity, {
  ProfissionalTecnicoComPessoaProps,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import ICreateProfissionalTecnicoUseCase, {
  CreateProfissionalTecnicoParam,
} from '@/modules/pessoas/domain/usecase/create_profissional_tecnico.usecase';
import ProfissionalTecnicoDomainException from '@/modules/pessoas/exceptions/profissional_tecnico_domain.exception';
import ProfissionalTecnicoServiceException from '@/modules/pessoas/exceptions/profissional_tecnico_service.exception';

export default class CreateProfissionalTecnicoService
  implements ICreateProfissionalTecnicoUseCase
{
  constructor(
    private readonly pessoaRepository: IPessoaRepository,
    private readonly profissionalRepository: IProfissionalTecnicoRepository,
  ) {}

  async execute(
    param: CreateProfissionalTecnicoParam,
  ): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps> {
    try {
      const pessoa = await this.pessoaRepository.findById(param.pessoaId);
      if (pessoa.isLeft()) return left(pessoa.value);
      if (!pessoa.value) {
        return left(
          new ProfissionalTecnicoServiceException({
            code: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_PESSOA,
            statusCode: 422,
          }),
        );
      }

      const existing = await this.profissionalRepository.findByPessoaId(
        param.pessoaId,
      );
      if (existing.isLeft()) return left(existing.value);
      if (existing.value) {
        return left(
          new ProfissionalTecnicoServiceException({
            code: ErrorCodeConstants.PROFISSIONAL_TECNICO_DUPLICATE_PESSOA,
            statusCode: 409,
          }),
        );
      }

      const entity = ProfissionalTecnicoEntity.create({
        ...param,
        ufRegistro: param.ufRegistro ?? null,
        titulo: param.titulo ?? null,
      });
      const saved = await this.profissionalRepository.save(entity);
      if (saved.isLeft()) return left(saved.value);

      return this.getView(saved.value.id);
    } catch (error) {
      if (error instanceof ProfissionalTecnicoDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ProfissionalTecnicoServiceException({
          code: ErrorCodeConstants.PROFISSIONAL_TECNICO_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async getView(
    id: string,
  ): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps> {
    const view = await this.profissionalRepository.findViewById(id);
    if (view.isLeft()) return left(view.value);
    if (!view.value) {
      return left(
        new ProfissionalTecnicoServiceException({
          code: ErrorCodeConstants.PROFISSIONAL_TECNICO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(view.value);
  }
}

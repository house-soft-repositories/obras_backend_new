import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import ICreateSetorUseCase, {
  CreateSetorParam,
} from '@/modules/orgaos/domain/usecase/create_setor.usecase';
import SetorDomainException from '@/modules/orgaos/exceptions/setor_domain.exception';
import SetorServiceException from '@/modules/orgaos/exceptions/setor_service.exception';

export default class CreateSetorService implements ICreateSetorUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(
    param: CreateSetorParam,
  ): AsyncResult<AppException, SetorEntity> {
    try {
      const orgao = await this.repository.existsOrgao(param.orgaoId);
      if (orgao.isLeft()) return left(orgao.value);
      return this.repository.save(
        SetorEntity.create({
          orgaoId: param.orgaoId,
          nome: param.nome,
          ativo: param.ativo,
        }),
      );
    } catch (error) {
      if (error instanceof SetorDomainException) return left(error);
      return left(
        new SetorServiceException({
          code: ErrorCodeConstants.SETOR_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

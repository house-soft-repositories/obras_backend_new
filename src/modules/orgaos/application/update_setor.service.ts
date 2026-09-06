import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import { denyUnlessSetorWriter } from '@/modules/orgaos/application/orgao_authorization';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import IUpdateSetorUseCase, {
  UpdateSetorParam,
} from '@/modules/orgaos/domain/usecase/update_setor.usecase';
import SetorDomainException from '@/modules/orgaos/exceptions/setor_domain.exception';
import SetorServiceException from '@/modules/orgaos/exceptions/setor_service.exception';

export default class UpdateSetorService implements IUpdateSetorUseCase {
  constructor(private readonly repository: ISetorRepository) {}

  async execute(param: UpdateSetorParam): AsyncResult<AppException, SetorEntity> {
    try {
      const denied = denyUnlessSetorWriter(param.role);
      if (denied) return left(denied);
      const current = await this.repository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      if (param.orgaoId !== undefined) {
        const orgao = await this.repository.existsOrgao(param.orgaoId);
        if (orgao.isLeft()) return left(orgao.value);
        if (param.orgaoId !== current.value.orgaoId) {
          const linkedUsers = await this.repository.countLinkedUsers(param.id);
          if (linkedUsers.isLeft()) return left(linkedUsers.value);
          if (linkedUsers.value > 0) {
            return left(
              new SetorServiceException({
                code: ErrorCodeConstants.SETOR_HAS_LINKED_USERS,
                statusCode: 422,
              }),
            );
          }
        }
      }
      return this.repository.save(
        current.value.update({
          orgaoId: param.orgaoId,
          nome: param.nome,
          ativo: param.ativo,
        }),
      );
    } catch (error) {
      if (error instanceof SetorDomainException) return left(error);
      return left(
        new SetorServiceException({
          code: ErrorCodeConstants.SETOR_UPDATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';
import { denyUnlessOrgaoWriter } from '@/modules/orgaos/application/orgao_authorization';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import IUpdateOrgaoUseCase, {
  UpdateOrgaoParam,
} from '@/modules/orgaos/domain/usecase/update_orgao.usecase';
import OrgaoDomainException from '@/modules/orgaos/exceptions/orgao_domain.exception';
import OrgaoServiceException from '@/modules/orgaos/exceptions/orgao_service.exception';

export default class UpdateOrgaoService implements IUpdateOrgaoUseCase {
  constructor(private readonly repository: IOrgaoRepository) {}

  async execute(param: UpdateOrgaoParam): AsyncResult<AppException, OrgaoEntity> {
    try {
      const denied = denyUnlessOrgaoWriter(param.role);
      if (denied) return left(denied);
      const current = await this.repository.findById(param.id);
      if (current.isLeft()) return left(current.value);
      if (param.localidadeId !== undefined) {
        const localidade = await this.repository.existsLocalidade(
          param.localidadeId,
        );
        if (localidade.isLeft()) return left(localidade.value);
      }
      return this.repository.save(
        current.value.update({
          localidadeId: param.localidadeId,
          nome: param.nome,
          sigla: param.sigla,
          tipo: param.tipo,
          responsavel: param.responsavel,
          email: param.email,
          telefone: param.telefone,
          ativo: param.ativo,
        }),
      );
    } catch (error) {
      if (error instanceof OrgaoDomainException) return left(error);
      return left(
        new OrgaoServiceException({
          code: ErrorCodeConstants.ORGAO_UPDATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

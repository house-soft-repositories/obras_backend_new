import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import ICreateParalisacaoUseCase, {
  CreateParalisacaoParam,
} from '@/modules/contratos/domain/usecase/create_paralisacao.usecase';
import ParalisacaoRepositoryException from '@/modules/contratos/exceptions/paralisacao_repository.exception';

export default class CreateParalisacaoService
  implements ICreateParalisacaoUseCase
{
  constructor(
    private readonly paralisacaoRepo: IParalisacaoRepository,
    private readonly contratoRepo: IContratoRepository,
    private readonly tc: TenantContext,
  ) {}

  async execute(
    param: CreateParalisacaoParam,
  ): AsyncResult<AppException, ParalisacaoEntity> {
    try {
      const contrato = await this.contratoRepo.findById(param.contratoId);
      if (contrato.isLeft()) return left(contrato.value);
      if (!contrato.value) {
        return left(
          new ParalisacaoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }

      const ctx = this.tc.require();
      const entity = ParalisacaoEntity.create({
        tenantId: ctx.tenantId,
        contratoId: param.contratoId,
        dataParalisacao: param.dataParalisacao,
        motivo: param.motivo,
        termoParalisacaoArquivoId: param.termoParalisacaoArquivoId,
      });

      return this.paralisacaoRepo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ParalisacaoRepositoryException({
          code: ErrorCodeConstants.PARALISACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

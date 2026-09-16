import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import ILiquidacaoRepository from '@/modules/obras/adapters/liquidacao_repository.interface';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import type { CreateLiquidacaoParam, UpdateLiquidacaoParam } from '@/modules/obras/domain/usecase/liquidacoes.usecase';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

export default class LiquidacoesService {
  constructor(
    private readonly repo: ILiquidacaoRepository,
    private readonly empenhos: IEmpenhoRepository,
    private readonly fontes: IFonteRepository,
    private readonly tc: TenantContext,
  ) {}

  private async ensureFonteAtiva(fonteId: string): AsyncResult<AppException, void> {
    const fonte = await this.fontes.findById(fonteId);
    if (fonte.isLeft()) return left(fonte.value);
    if (!fonte.value)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 404 }));
    if (!fonte.value.ativo)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_INATIVA, statusCode: 422 }));
    return right(undefined);
  }

  private async ensureEmpenhoDaObra(obraId: string, empenhoId: string): AsyncResult<AppException, EmpenhoEntity> {
    const empenho = await this.empenhos.findById(empenhoId);
    if (empenho.isLeft()) return left(empenho.value);
    if (!empenho.value || empenho.value.obraId !== obraId)
      return left(
        new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_NOT_FOUND, statusCode: 422 }),
      );
    return right(empenho.value);
  }

  async create(param: CreateLiquidacaoParam): AsyncResult<AppException, LiquidacaoEntity> {
    try {
      const ctx = this.tc.require();
      const okFonte = await this.ensureFonteAtiva(param.fonteId);
      if (okFonte.isLeft()) return left(okFonte.value);
      const empenho = await this.ensureEmpenhoDaObra(param.obraId, param.empenhoId);
      if (empenho.isLeft()) return left(empenho.value);
      const jaLiquidado = await this.empenhos.sumLiquidado(param.empenhoId);
      if (jaLiquidado.isLeft()) return left(jaLiquidado.value);
      if (jaLiquidado.value + param.valor > empenho.value.valor + 1e-9)
        return left(
          new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_EXCEDE_EMPENHO, statusCode: 422 }),
        );
      const entity = LiquidacaoEntity.create({ ...param, tenantId: ctx.tenantId });
      return this.repo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async list(obraId: string): AsyncResult<AppException, LiquidacaoEntity[]> {
    return this.repo.listByObra(obraId);
  }

  async get(obraId: string, id: string): AsyncResult<AppException, LiquidacaoEntity> {
    try {
      const found = await this.repo.findById(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_NOT_FOUND, statusCode: 404 }));
      const empenho = await this.ensureEmpenhoDaObra(obraId, found.value.empenhoId);
      if (empenho.isLeft()) return left(empenho.value);
      return right(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async update(param: UpdateLiquidacaoParam): AsyncResult<AppException, LiquidacaoEntity> {
    try {
      const current = await this.get(param.obraId, param.id);
      if (current.isLeft()) return left(current.value);
      if (param.patch.fonteId !== undefined) {
        const okFonte = await this.ensureFonteAtiva(param.patch.fonteId);
        if (okFonte.isLeft()) return left(okFonte.value);
      }
      if (param.patch.valor !== undefined) {
        const empenho = await this.ensureEmpenhoDaObra(param.obraId, current.value.empenhoId);
        if (empenho.isLeft()) return left(empenho.value);
        const jaLiquidado = await this.empenhos.sumLiquidado(current.value.empenhoId, param.id);
        if (jaLiquidado.isLeft()) return left(jaLiquidado.value);
        if (jaLiquidado.value + param.patch.valor > empenho.value.valor + 1e-9)
          return left(
            new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_EXCEDE_EMPENHO, statusCode: 422 }),
          );
      }
      current.value.update(param.patch);
      return this.repo.save(current.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async remove(obraId: string, id: string): AsyncResult<AppException, void> {
    const current = await this.get(obraId, id);
    if (current.isLeft()) return left(current.value);
    return this.repo.delete(id);
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import type { CreateEmpenhoParam, UpdateEmpenhoParam } from '@/modules/obras/domain/usecase/empenhos.usecase';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

export default class EmpenhosService {
  constructor(
    private readonly repo: IEmpenhoRepository,
    private readonly obras: IObraRepository,
    private readonly fontes: IFonteRepository,
    private readonly tc: TenantContext,
  ) {}

  private async ensureObra(obraId: string): AsyncResult<AppException, void> {
    const obra = await this.obras.findById(obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
    return right(undefined);
  }

  private async ensureFonteAtiva(fonteId: string): AsyncResult<AppException, void> {
    const fonte = await this.fontes.findById(fonteId);
    if (fonte.isLeft()) return left(fonte.value);
    if (!fonte.value)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 404 }));
    if (!fonte.value.ativo)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_INATIVA, statusCode: 422 }));
    return right(undefined);
  }

  async create(param: CreateEmpenhoParam): AsyncResult<AppException, EmpenhoEntity> {
    try {
      const ctx = this.tc.require();
      const okObra = await this.ensureObra(param.obraId);
      if (okObra.isLeft()) return left(okObra.value);
      const okFonte = await this.ensureFonteAtiva(param.fonteId);
      if (okFonte.isLeft()) return left(okFonte.value);
      const entity = EmpenhoEntity.create({ ...param, tenantId: ctx.tenantId });
      return this.repo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async list(obraId: string): AsyncResult<AppException, EmpenhoEntity[]> {
    const okObra = await this.ensureObra(obraId);
    if (okObra.isLeft()) return left(okObra.value);
    return this.repo.listByObra(obraId);
  }

  async get(obraId: string, id: string): AsyncResult<AppException, EmpenhoEntity> {
    try {
      const found = await this.repo.findById(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value || found.value.obraId !== obraId)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_NOT_FOUND, statusCode: 404 }));
      return right(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async update(param: UpdateEmpenhoParam): AsyncResult<AppException, EmpenhoEntity> {
    try {
      const current = await this.get(param.obraId, param.id);
      if (current.isLeft()) return left(current.value);
      if (param.patch.fonteId !== undefined) {
        const okFonte = await this.ensureFonteAtiva(param.patch.fonteId);
        if (okFonte.isLeft()) return left(okFonte.value);
      }
      current.value.update(param.patch);
      return this.repo.save(current.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async remove(obraId: string, id: string): AsyncResult<AppException, void> {
    const current = await this.get(obraId, id);
    if (current.isLeft()) return left(current.value);
    return this.repo.delete(id);
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import type { CreateEmpenhoParam, EmpenhoComFonte, UpdateEmpenhoParam } from '@/modules/obras/domain/usecase/empenhos.usecase';
import { toFonteResumo } from '@/modules/obras/domain/usecase/fonte_resumo';
import type FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
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

  private async ensureFonteAtiva(fonteId: string): AsyncResult<AppException, FonteEntity> {
    const fonte = await this.fontes.findById(fonteId);
    if (fonte.isLeft()) return left(fonte.value);
    if (!fonte.value)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 404 }));
    if (!fonte.value.ativo)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_INATIVA, statusCode: 422 }));
    return right(fonte.value);
  }

  async create(param: CreateEmpenhoParam): AsyncResult<AppException, EmpenhoComFonte> {
    try {
      const ctx = this.tc.require();
      const okObra = await this.ensureObra(param.obraId);
      if (okObra.isLeft()) return left(okObra.value);
      const okFonte = await this.ensureFonteAtiva(param.fonteId);
      if (okFonte.isLeft()) return left(okFonte.value);
      const entity = EmpenhoEntity.create({ ...param, tenantId: ctx.tenantId });
      const saved = await this.repo.save(entity);
      if (saved.isLeft()) return left(saved.value);
      // Fonte já validada acima: monta o resumo sem query extra.
      return right({ ...saved.value.toObject(), fonte: toFonteResumo(okFonte.value) });
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async list(obraId: string): AsyncResult<AppException, EmpenhoComFonte[]> {
    const okObra = await this.ensureObra(obraId);
    if (okObra.isLeft()) return left(okObra.value);
    // Query única com LEFT JOIN em fontes (sem N+1).
    return this.repo.listByObraWithFonte(obraId);
  }

  async get(obraId: string, id: string): AsyncResult<AppException, EmpenhoComFonte> {
    try {
      // Query única com LEFT JOIN em fontes.
      const found = await this.repo.findByIdWithFonte(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value || found.value.obraId !== obraId)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_NOT_FOUND, statusCode: 404 }));
      return right(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  private async findEntity(obraId: string, id: string): AsyncResult<AppException, EmpenhoEntity> {
    const found = await this.repo.findById(id);
    if (found.isLeft()) return left(found.value);
    if (!found.value || found.value.obraId !== obraId)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_NOT_FOUND, statusCode: 404 }));
    return right(found.value);
  }

  async update(param: UpdateEmpenhoParam): AsyncResult<AppException, EmpenhoComFonte> {
    try {
      const current = await this.findEntity(param.obraId, param.id);
      if (current.isLeft()) return left(current.value);
      if (param.patch.fonteId !== undefined) {
        const okFonte = await this.ensureFonteAtiva(param.patch.fonteId);
        if (okFonte.isLeft()) return left(okFonte.value);
      }
      current.value.update(param.patch);
      const saved = await this.repo.save(current.value);
      if (saved.isLeft()) return left(saved.value);
      // Releitura com JOIN (1 query) para devolver o resumo da fonte.
      const enriched = await this.repo.findByIdWithFonte(saved.value.id);
      if (enriched.isLeft()) return left(enriched.value);
      if (!enriched.value)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_NOT_FOUND, statusCode: 404 }));
      return right(enriched.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async remove(obraId: string, id: string): AsyncResult<AppException, void> {
    const current = await this.findEntity(obraId, id);
    if (current.isLeft()) return left(current.value);
    return this.repo.delete(id);
  }
}

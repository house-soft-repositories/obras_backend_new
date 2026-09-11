import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObservacaoRepository from '@/modules/obras/adapters/observacao_repository.interface';
import ObservacaoEntity from '@/modules/obras/domain/entities/observacao.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class ObservacoesService {
  constructor(
    private readonly repo: IObservacaoRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async create(param: { obraId: string; texto: string; autorUsuarioId: string }): AsyncResult<AppException, ObservacaoEntity> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const obra = await this.ds.query(`SELECT id FROM "${schema}"."obras" WHERE id=$1 AND deleted_at IS NULL`, [param.obraId]);
      if (!obra.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      const entity = ObservacaoEntity.create({
        tenantId: ctx.tenantId,
        obraId: param.obraId,
        texto: param.texto,
        autorUsuarioId: param.autorUsuarioId,
      });
      return this.repo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBSERVACAO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async list(obraId: string): AsyncResult<AppException, ObservacaoEntity[]> {
    return this.repo.listByObra(obraId);
  }

  async update(param: { id: string; texto: string }): AsyncResult<AppException, ObservacaoEntity> {
    try {
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBSERVACAO_NOT_FOUND, statusCode: 404 }));
      found.value.updateTexto(param.texto);
      return this.repo.save(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBSERVACAO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async remove(id: string): AsyncResult<AppException, void> {
    const found = await this.repo.findById(id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBSERVACAO_NOT_FOUND, statusCode: 404 }));
    return this.repo.delete(id);
  }
}

import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import TagEntity from '@/modules/obras/domain/entities/tag.entity';
import ITagRepository from '@/modules/obras/adapters/tag_repository.interface';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class TagsService {
  constructor(
    private readonly tagRepo: ITagRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private normalize(input: string): string[] {
    return input
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length >= 2 && s.length <= 40);
  }

  async aplicar(param: { obraId: string; tags: string }): AsyncResult<AppException, TagEntity[]> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const obra = await this.ds.query(`SELECT id FROM "${schema}"."obras" WHERE id=$1 AND deleted_at IS NULL`, [param.obraId]);
      if (!obra.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      const names = this.normalize(param.tags);
      if (!names.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_TAG_INVALID, statusCode: 400 }));
      const result: TagEntity[] = [];
      for (const nome of names) {
        const found = await this.tagRepo.findByNome(nome);
        if (found.isLeft()) return left(found.value);
        let tag = found.value;
        if (!tag) {
          const created = TagEntity.create({ tenantId: ctx.tenantId, nome });
          const saved = await this.tagRepo.save(created);
          if (saved.isLeft()) return left(saved.value);
          tag = saved.value;
        }
        const attach = await this.tagRepo.attach(param.obraId, tag.id);
        if (attach.isLeft()) return left(attach.value);
        result.push(tag);
      }
      return right(result);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async list(obraId: string): AsyncResult<AppException, TagEntity[]> {
    return this.tagRepo.listByObra(obraId);
  }

  async detach(param: { obraId: string; tagId: string }): AsyncResult<AppException, void> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const obra = await this.ds.query(`SELECT id FROM "${schema}"."obras" WHERE id=$1 AND deleted_at IS NULL`, [param.obraId]);
      if (!obra.length) return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      return this.tagRepo.detach(param.obraId, param.tagId);
    } catch (cause) {
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
}

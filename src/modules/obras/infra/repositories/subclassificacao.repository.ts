import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { ISubclassificacaoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { SubclassificacaoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { SubclassificacaoMapper } from '@/modules/obras/infra/mapper/cadastro.mapper';
import { SubclassificacaoModel } from '@/modules/obras/infra/models/cadastro.model';
import { withCadastroTransaction } from '@/modules/obras/infra/repositories/cadastro_repository.transaction';
import { DataSource, FindOptionsWhere } from 'typeorm';

export default class SubclassificacaoRepository implements ISubclassificacaoRepository {
  constructor(private readonly ds: DataSource, private readonly tc: TenantContext) {}

  findPage(page: PageOptionsEntity, ativos = false, classificacaoId?: string): AsyncResult<AppException, PageEntity<SubclassificacaoEntity>> {
    return withCadastroTransaction(this.ds, this.tc, SubclassificacaoModel, async (repo, tenantId) => {
      const [models, count] = await repo.findAndCount({ where: { tenantId, ...(ativos ? { ativo: true } : {}), ...(classificacaoId ? { classificacaoId } : {}) } as FindOptionsWhere<SubclassificacaoModel>, order: { nome: 'ASC' }, take: page.take ?? 20, skip: page.skip });
      return new PageEntity(models.map((model) => SubclassificacaoMapper.toEntity(model)), new PageMetaEntity({ pageOptions: page, itemCount: count }));
    });
  }

  findOne(id: string): AsyncResult<AppException, SubclassificacaoEntity | null> {
    return withCadastroTransaction(this.ds, this.tc, SubclassificacaoModel, async (repo, tenantId) => {
      const model = await repo.findOneBy({ id, tenantId });
      return model ? SubclassificacaoMapper.toEntity(model) : null;
    });
  }

  save(entity: SubclassificacaoEntity): AsyncResult<AppException, SubclassificacaoEntity> {
    return withCadastroTransaction(this.ds, this.tc, SubclassificacaoModel, async (repo) => SubclassificacaoMapper.toEntity(await repo.save(repo.create(SubclassificacaoMapper.toModel(entity)))));
  }
}

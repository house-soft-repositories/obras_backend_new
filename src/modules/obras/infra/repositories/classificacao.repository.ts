import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { IClassificacaoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { ClassificacaoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { ClassificacaoMapper } from '@/modules/obras/infra/mapper/cadastro.mapper';
import { ClassificacaoModel } from '@/modules/obras/infra/models/cadastro.model';
import { withCadastroTransaction } from '@/modules/obras/infra/repositories/cadastro_repository.transaction';
import { DataSource, FindOptionsWhere } from 'typeorm';

export default class ClassificacaoRepository implements IClassificacaoRepository {
  constructor(private readonly ds: DataSource, private readonly tc: TenantContext) {}

  findPage(page: PageOptionsEntity, ativos = false): AsyncResult<AppException, PageEntity<ClassificacaoEntity>> {
    return withCadastroTransaction(this.ds, this.tc, ClassificacaoModel, async (repo, tenantId) => {
      const [models, count] = await repo.findAndCount({ where: { tenantId, ...(ativos ? { ativo: true } : {}) } as FindOptionsWhere<ClassificacaoModel>, order: { nome: 'ASC' }, take: page.take ?? 20, skip: page.skip });
      return new PageEntity(models.map((model) => ClassificacaoMapper.toEntity(model)), new PageMetaEntity({ pageOptions: page, itemCount: count }));
    });
  }

  findOne(id: string): AsyncResult<AppException, ClassificacaoEntity | null> {
    return withCadastroTransaction(this.ds, this.tc, ClassificacaoModel, async (repo, tenantId) => {
      const model = await repo.findOneBy({ id, tenantId });
      return model ? ClassificacaoMapper.toEntity(model) : null;
    });
  }

  save(entity: ClassificacaoEntity): AsyncResult<AppException, ClassificacaoEntity> {
    return withCadastroTransaction(this.ds, this.tc, ClassificacaoModel, async (repo) => ClassificacaoMapper.toEntity(await repo.save(repo.create(ClassificacaoMapper.toModel(entity)))));
  }
}

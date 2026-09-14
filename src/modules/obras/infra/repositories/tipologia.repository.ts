import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { ITipologiaRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { TipologiaEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { TipologiaMapper } from '@/modules/obras/infra/mapper/cadastro.mapper';
import { TipologiaModel } from '@/modules/obras/infra/models/cadastro.model';
import { withCadastroTransaction } from '@/modules/obras/infra/repositories/cadastro_repository.transaction';
import { DataSource, FindOptionsWhere } from 'typeorm';

export default class TipologiaRepository implements ITipologiaRepository {
  constructor(private readonly ds: DataSource, private readonly tc: TenantContext) {}

  findPage(page: PageOptionsEntity, ativos = false): AsyncResult<AppException, PageEntity<TipologiaEntity>> {
    return withCadastroTransaction(this.ds, this.tc, TipologiaModel, async (repo, tenantId) => {
      const [models, count] = await repo.findAndCount({ where: { tenantId, ...(ativos ? { ativo: true } : {}) } as FindOptionsWhere<TipologiaModel>, order: { nome: 'ASC' }, take: page.take ?? 20, skip: page.skip });
      return new PageEntity(models.map((model) => TipologiaMapper.toEntity(model)), new PageMetaEntity({ pageOptions: page, itemCount: count }));
    });
  }

  findOne(id: string): AsyncResult<AppException, TipologiaEntity | null> {
    return withCadastroTransaction(this.ds, this.tc, TipologiaModel, async (repo, tenantId) => {
      const model = await repo.findOneBy({ id, tenantId });
      return model ? TipologiaMapper.toEntity(model) : null;
    });
  }

  save(entity: TipologiaEntity): AsyncResult<AppException, TipologiaEntity> {
    return withCadastroTransaction(this.ds, this.tc, TipologiaModel, async (repo) => TipologiaMapper.toEntity(await repo.save(repo.create(TipologiaMapper.toModel(entity)))));
  }
}

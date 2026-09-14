import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { ISubtipologiaRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { SubtipologiaEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { SubtipologiaMapper } from '@/modules/obras/infra/mapper/cadastro.mapper';
import { SubtipologiaModel } from '@/modules/obras/infra/models/cadastro.model';
import { withCadastroTransaction } from '@/modules/obras/infra/repositories/cadastro_repository.transaction';
import { DataSource, FindOptionsWhere } from 'typeorm';

export default class SubtipologiaRepository implements ISubtipologiaRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  findPage(
    page: PageOptionsEntity,
    ativos = false,
    tipologiaId?: string,
  ): AsyncResult<AppException, PageEntity<SubtipologiaEntity>> {
    return withCadastroTransaction(
      this.ds,
      this.tc,
      SubtipologiaModel,
      async (repo, tenantId) => {
        const [models, count] = await repo.findAndCount({
          where: {
            tenantId,
            ...(ativos ? { ativo: true } : {}),
            ...(tipologiaId ? { tipologiaId } : {}),
          } as FindOptionsWhere<SubtipologiaModel>,
          order: { nome: 'ASC' },
          take: page.take,
          skip: page.skip,
        });
        return new PageEntity(
          models.map((model) => SubtipologiaMapper.toEntity(model)),
          new PageMetaEntity({ pageOptions: page, itemCount: count }),
        );
      },
    );
  }

  findOne(id: string): AsyncResult<AppException, SubtipologiaEntity | null> {
    return withCadastroTransaction(
      this.ds,
      this.tc,
      SubtipologiaModel,
      async (repo, tenantId) => {
        const model = await repo.findOneBy({ id, tenantId });
        return model ? SubtipologiaMapper.toEntity(model) : null;
      },
    );
  }

  save(
    entity: SubtipologiaEntity,
  ): AsyncResult<AppException, SubtipologiaEntity> {
    return withCadastroTransaction(
      this.ds,
      this.tc,
      SubtipologiaModel,
      async (repo) =>
        SubtipologiaMapper.toEntity(
          await repo.save(repo.create(SubtipologiaMapper.toModel(entity))),
        ),
    );
  }
}

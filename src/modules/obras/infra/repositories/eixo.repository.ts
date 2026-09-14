import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { IEixoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { EixoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { EixoMapper } from '@/modules/obras/infra/mapper/cadastro.mapper';
import { EixoModel } from '@/modules/obras/infra/models/cadastro.model';
import { withCadastroTransaction } from '@/modules/obras/infra/repositories/cadastro_repository.transaction';
import { DataSource, FindOptionsWhere } from 'typeorm';

export default class EixoRepository implements IEixoRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  findPage(
    page: PageOptionsEntity,
    ativos = false,
  ): AsyncResult<AppException, PageEntity<EixoEntity>> {
    return withCadastroTransaction(
      this.ds,
      this.tc,
      EixoModel,
      async (repo, tenantId) => {
        const [models, count] = await repo.findAndCount({
          where: {
            tenantId,
            ...(ativos ? { ativo: true } : {}),
          } as FindOptionsWhere<EixoModel>,
          order: { nome: 'ASC' },
          take: page.take ?? 20,
          skip: page.skip,
        });
        return new PageEntity(
          models.map((model) => EixoMapper.toEntity(model)),
          new PageMetaEntity({ pageOptions: page, itemCount: count }),
        );
      },
    );
  }
  findOne(id: string): AsyncResult<AppException, EixoEntity | null> {
    return withCadastroTransaction(
      this.ds,
      this.tc,
      EixoModel,
      async (repo, tenantId) => {
        const model = await repo.findOneBy({ id, tenantId });
        return model ? EixoMapper.toEntity(model) : null;
      },
    );
  }
  save(entity: EixoEntity): AsyncResult<AppException, EixoEntity> {
    return withCadastroTransaction(this.ds, this.tc, EixoModel, async (repo) =>
      EixoMapper.toEntity(
        await repo.save(repo.create(EixoMapper.toModel(entity))),
      ),
    );
  }
}

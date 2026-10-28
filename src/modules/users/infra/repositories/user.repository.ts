import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import ITenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IUserRepository, {
  FindUserQuery,
} from '@/modules/users/adapters/user_repository.interface';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import UserRepositoryException from '@/modules/users/exceptions/user_repository.exception';
import UserMapper from '@/modules/users/infra/mapper/user.mapper';
import UserModel from '@/modules/users/infra/models/user.model';
import { UsuarioWithOrganizationalReadModel } from '@/modules/users/infra/read-models/usuario_with_organizational_read_model';
import { DataSource, Repository } from 'typeorm';
import { withManager } from '@/core/multitenancy/tenant_manager';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';
import SetorModel from '@/modules/orgaos/infra/models/setor.model';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

type UserRepositoryErrorCode =
  | typeof ErrorCodeConstants.USER_NOT_FOUND
  | typeof ErrorCodeConstants.USER_REPOSITORY_FAILED
  | typeof ErrorCodeConstants.LOCALIDADE_NOT_FOUND
  | typeof ErrorCodeConstants.ORGAO_NOT_FOUND
  | typeof ErrorCodeConstants.SETOR_NOT_FOUND;

export default class UserRepository implements IUserRepository {
  constructor(
    private readonly repository: Repository<UserModel>,
    private readonly dataSource: DataSource,
    private readonly tenantSchemaResolver: ITenantSchemaResolver,
    private readonly tenantContext: TenantContext,
  ) {}

  async findOne(query: FindUserQuery): AsyncResult<AppException, UserEntity> {
    try {
      const builder = this.repository.createQueryBuilder('user');
      if (query.id) builder.where('user.id = :id', { id: query.id });
      else if (query.email)
        builder.where('user.email = :email', {
          email: query.email.toLowerCase(),
        });
      else throw new Error('email or id is required');

      if (query.tenantId !== null) {
        builder.andWhere('user.tenant_id = :tenantId', {
          tenantId: query.tenantId,
        });
      }

      const model = await builder.getOne();

      if (!model) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      return right(UserMapper.toEntity(model));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async findById(id: string): AsyncResult<AppException, UserEntity> {
    try {
      const model = await this.repository.findOne({ where: { id } });
      if (!model) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      return right(UserMapper.toEntity(model));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async listByTenantId(
    tenantId: string,
  ): AsyncResult<AppException, UserEntity[]> {
    try {
      const models = await this.repository.find({
        where: { tenantId },
        order: { name: 'ASC' },
      });
      return right(models.map((model) => UserMapper.toEntity(model)));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async listWithOrganizational(
    pageOptions: PageOptionsEntity,
    tenantId: string | null,
    filters: { role?: UserRole; orgaoId?: string; setorId?: string } = {},
  ): AsyncResult<AppException, PageEntity<UsuarioWithOrganizationalReadModel>> {
    try {
      if (tenantId === null && (filters.orgaoId || filters.setorId))
        return right(
          new PageEntity([], new PageMetaEntity({ pageOptions, itemCount: 0 })),
        );
      const order = pageOptions.order === 'DESC' ? 'DESC' : 'ASC';
      const buildPage = async (
        query: ReturnType<Repository<UserModel>['createQueryBuilder']>,
      ) => {
        const queryWithJoins = tenantId
          ? query
              .leftJoin(
                LocalidadeModel,
                'localidade',
                'localidade.id = user.localidade_id',
              )
              .leftJoin(OrgaoModel, 'orgao', 'orgao.id = user.orgao_id')
              .leftJoin(SetorModel, 'setor', 'setor.id = user.setor_id')
          : query;
        const queryWithSelection = queryWithJoins
          .select([
            'user.id AS "id"',
            'user.name AS "name"',
            'user.email AS "email"',
            'user.role AS "role"',
            'user.tenant_id AS "tenantId"',
            'user.localidade_id AS "localidadeId"',
            'user.orgao_id AS "orgaoId"',
            'user.setor_id AS "setorId"',
            'user.created_at AS "createdAt"',
            'user.updated_at AS "updatedAt"',
            tenantId
              ? 'localidade.nome AS "localidadeNome"'
              : 'NULL AS "localidadeNome"',
            tenantId
              ? 'localidade.uf AS "localidadeUf"'
              : 'NULL AS "localidadeUf"',
            tenantId ? 'orgao.nome AS "orgaoNome"' : 'NULL AS "orgaoNome"',
            tenantId ? 'orgao.sigla AS "orgaoSigla"' : 'NULL AS "orgaoSigla"',
            tenantId ? 'setor.nome AS "setorNome"' : 'NULL AS "setorNome"',
            tenantId
              ? 'setor.orgao_id AS "setorOrgaoId"'
              : 'NULL AS "setorOrgaoId"',
          ])
          .where(
            tenantId === null
              ? 'user.tenant_id IS NULL'
              : 'user.tenant_id = :tenantId',
            { tenantId },
          );
        if (filters.role)
          queryWithSelection.andWhere('user.role = :role', {
            role: filters.role,
          });
        if (filters.orgaoId)
          queryWithSelection.andWhere('user.orgao_id = :orgaoId', {
            orgaoId: filters.orgaoId,
          });
        if (filters.setorId)
          queryWithSelection.andWhere('user.setor_id = :setorId', {
            setorId: filters.setorId,
          });
        const [rows, itemCount] = await Promise.all([
          queryWithSelection
            .clone()
            .orderBy('user.name', order)
            .take(pageOptions.take)
            .skip(pageOptions.skip)
            .getRawMany(),
          queryWithSelection.clone().getCount(),
        ]);
        return new PageEntity(
          rows.map((row) => UserMapper.toReadModelWithOrganizational(row)),
          new PageMetaEntity({ pageOptions, itemCount }),
        );
      };
      const page = tenantId
        ? await withManager(this.dataSource, this.tenantContext, (manager) =>
            buildPage(
              manager.getRepository(UserModel).createQueryBuilder('user'),
            ),
          )
        : await buildPage(this.repository.createQueryBuilder('user'));
      return right(page);
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async save(user: UserEntity): AsyncResult<AppException, UserEntity> {
    try {
      const saved = await this.repository.save(
        this.repository.create(UserMapper.toModel(user)),
      );
      return right(UserMapper.toEntity(saved));
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  async existsLocalidade(
    localidadeId: string,
    tenantId: string,
  ): AsyncResult<AppException, true> {
    return this.existsInTenantSchema(
      'localidades',
      localidadeId,
      tenantId,
      ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
    );
  }

  async existsOrgao(
    orgaoId: string,
    tenantId: string,
  ): AsyncResult<AppException, true> {
    return this.existsInTenantSchema(
      'orgaos',
      orgaoId,
      tenantId,
      ErrorCodeConstants.ORGAO_NOT_FOUND,
    );
  }

  async findSetorById(
    setorId: string,
    tenantId: string,
  ): AsyncResult<AppException, { id: string; orgaoId: string }> {
    try {
      const schema = await this.resolveSchema(tenantId);
      if (!schema) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
            statusCode: 500,
          }),
        );
      }
      const [found] = await this.dataSource.query<
        { id: string; orgaoId: string }[]
      >(
        `SELECT id, orgao_id AS "orgaoId"
         FROM "${schema}"."setores"
         WHERE id = $1`,
        [setorId],
      );
      return found
        ? right(found)
        : left(
            new UserRepositoryException({
              code: ErrorCodeConstants.SETOR_NOT_FOUND,
              statusCode: 404,
            }),
          );
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async existsInTenantSchema(
    table: 'localidades' | 'orgaos',
    id: string,
    tenantId: string,
    notFoundCode: UserRepositoryErrorCode,
  ): AsyncResult<AppException, true> {
    try {
      const schema = await this.resolveSchema(tenantId);
      if (!schema) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
            statusCode: 500,
          }),
        );
      }
      const [found] = await this.dataSource.query<{ id: string }[]>(
        `SELECT id FROM "${schema}"."${table}" WHERE id = $1`,
        [id],
      );
      return found
        ? right(true)
        : left(
            new UserRepositoryException({
              code: notFoundCode,
              statusCode: 404,
            }),
          );
    } catch (error) {
      return left(
        new UserRepositoryException({
          code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async resolveSchema(tenantId: string): Promise<string | null> {
    const resolved = await this.tenantSchemaResolver.resolve(tenantId);
    return resolved?.schemaName ?? null;
  }
}

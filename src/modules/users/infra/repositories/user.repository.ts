import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import ITenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver.interface';
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
  ) {}

  async findOne(query: FindUserQuery): AsyncResult<AppException, UserEntity> {
    try {
      const builder = this.repository
        .createQueryBuilder('user')
        .where('user.email = :email', { email: query.email.toLowerCase() });

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
  ): AsyncResult<AppException, PageEntity<UsuarioWithOrganizationalReadModel>> {
    try {
      const order = pageOptions.order === 'DESC' ? 'DESC' : 'ASC';

      if (tenantId === null) {
        type Row = UserModel & {
          localidadeNome: string | null;
          localidadeUf: string | null;
          orgaoNome: string | null;
          orgaoSigla: string | null;
          setorNome: string | null;
          setorOrgaoId: string | null;
        };
        const rows = await this.dataSource.query<Row[]>(
          `SELECT u.id, u.name, u.email, u.password, u.role,
                  u.tenant_id AS "tenantId", u.localidade_id AS "localidadeId",
                  u.orgao_id AS "orgaoId", u.setor_id AS "setorId",
                  u.created_at AS "createdAt", u.updated_at AS "updatedAt",
                  null AS "localidadeNome", null AS "localidadeUf",
                  null AS "orgaoNome", null AS "orgaoSigla",
                  null AS "setorNome", null AS "setorOrgaoId"
           FROM public.users u
           WHERE u.tenant_id IS NULL
           ORDER BY u.name ${order}
           LIMIT $1 OFFSET $2`,
          [pageOptions.take, pageOptions.skip],
        );
        const [countResult] = await this.dataSource.query<{ count: string }[]>(
          `SELECT COUNT(*)::int AS count FROM public.users WHERE tenant_id IS NULL`,
        );
        const meta = new PageMetaEntity({
          pageOptions,
          itemCount: Number(countResult?.count ?? 0),
        });
        return right(
          new PageEntity(
            rows.map((row) => UserMapper.toReadModelWithOrganizational(row)),
            meta,
          ),
        );
      }

      const schema = await this.resolveSchema(tenantId);
      if (!schema) {
        return left(
          new UserRepositoryException({
            code: ErrorCodeConstants.USER_REPOSITORY_FAILED,
            statusCode: 500,
          }),
        );
      }

      type Row = UserModel & {
        localidadeNome: string | null;
        localidadeUf: string | null;
        orgaoNome: string | null;
        orgaoSigla: string | null;
        setorNome: string | null;
        setorOrgaoId: string | null;
      };

      const rows = await this.dataSource.query<Row[]>(
        `SELECT u.id, u.name, u.email, u.password, u.role,
                u.tenant_id AS "tenantId", u.localidade_id AS "localidadeId",
                u.orgao_id AS "orgaoId", u.setor_id AS "setorId",
                u.created_at AS "createdAt", u.updated_at AS "updatedAt",
                l.nome AS "localidadeNome", l.uf AS "localidadeUf",
                o.nome AS "orgaoNome", o.sigla AS "orgaoSigla",
                s.nome AS "setorNome", s.orgao_id AS "setorOrgaoId"
         FROM public.users u
         LEFT JOIN "${schema}"."localidades" l ON l.id = u.localidade_id
         LEFT JOIN "${schema}"."orgaos" o ON o.id = u.orgao_id
         LEFT JOIN "${schema}"."setores" s ON s.id = u.setor_id
         WHERE u.tenant_id = $1
         ORDER BY u.name ${order}
         LIMIT $2 OFFSET $3`,
        [tenantId, pageOptions.take, pageOptions.skip],
      );

      const [countResult] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM public.users WHERE tenant_id = $1`,
        [tenantId],
      );

      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countResult?.count ?? 0),
      });

      return right(
        new PageEntity(
          rows.map((row) =>
            UserMapper.toReadModelWithOrganizational(row as any),
          ),
          meta,
        ),
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

import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ISetorRepository from '@/modules/orgaos/adapters/setor_repository.interface';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';
import SetorMapper from '@/modules/orgaos/infra/mapper/setor.mapper';
import SetorModel from '@/modules/orgaos/infra/models/setor.model';

export default class SetorRepository implements ISetorRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: SetorEntity): AsyncResult<AppException, SetorEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = SetorMapper.toModel(entity);
      const [saved] = await this.dataSource.query<SetorModel[]>(
        `INSERT INTO "${schema}"."setores"
           (id, orgao_id, nome, ativo, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET
           orgao_id = EXCLUDED.orgao_id,
           nome = EXCLUDED.nome,
           ativo = EXCLUDED.ativo,
           updated_at = EXCLUDED.updated_at
         RETURNING id, orgao_id AS "orgaoId", nome, ativo,
           created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          value.id,
          value.orgaoId,
          value.nome,
          value.ativo,
          value.createdAt,
          value.updatedAt,
        ],
      );
      return right(SetorMapper.toEntity(saved));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findById(id: string): AsyncResult<AppException, SetorEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [found] = await this.dataSource.query<SetorModel[]>(
        `SELECT id, orgao_id AS "orgaoId", nome, ativo,
           created_at AS "createdAt", updated_at AS "updatedAt"
         FROM "${schema}"."setores"
         WHERE id = $1`,
        [id],
      );
      return found
        ? right(SetorMapper.toEntity(found))
        : left(
            new SetorRepositoryException({
              code: ErrorCodeConstants.SETOR_NOT_FOUND,
              statusCode: 404,
            }),
          );
    } catch (cause) {
      return left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findAllByOrgao(
    orgaoId: string,
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<SetorEntity>> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<SetorModel[]>(
        `SELECT id, orgao_id AS "orgaoId", nome, ativo,
           created_at AS "createdAt", updated_at AS "updatedAt"
         FROM "${schema}"."setores"
         WHERE orgao_id = $1
         ORDER BY nome ${pageOptions.order}
         LIMIT $2 OFFSET $3`,
        [orgaoId, pageOptions.take, pageOptions.skip],
      );
      const [countResult] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count
         FROM "${schema}"."setores"
         WHERE orgao_id = $1`,
        [orgaoId],
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countResult?.count ?? 0),
      });
      return right(
        new PageEntity(
          rows.map((row) => SetorMapper.toEntity(row)),
          meta,
        ),
      );
    } catch (cause) {
      return left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async existsOrgao(orgaoId: string): AsyncResult<AppException, true> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [found] = await this.dataSource.query<{ id: string }[]>(
        `SELECT id FROM "${schema}"."orgaos" WHERE id = $1`,
        [orgaoId],
      );
      return found
        ? right(true)
        : left(
            new SetorRepositoryException({
              code: ErrorCodeConstants.ORGAO_NOT_FOUND,
              statusCode: 404,
            }),
          );
    } catch (cause) {
      return left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async countLinkedUsers(setorId: string): AsyncResult<AppException, number> {
    try {
      const [result] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count
         FROM public.users
         WHERE setor_id = $1`,
        [setorId],
      );
      return right(Number(result?.count ?? 0));
    } catch (cause) {
      return left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  private toFailure(cause: unknown): SetorRepositoryException {
    if (this.isForeignKeyViolation(cause, 'FK_setores_orgaos')) {
      return new SetorRepositoryException({
        code: ErrorCodeConstants.ORGAO_NOT_FOUND,
        statusCode: 404,
        cause,
      });
    }
    return new SetorRepositoryException({
      code: ErrorCodeConstants.SETOR_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }

  private isForeignKeyViolation(error: unknown, constraint: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'driverError' in error &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === '23503' &&
      'constraint' in error.driverError &&
      error.driverError.constraint === constraint
    );
  }
}

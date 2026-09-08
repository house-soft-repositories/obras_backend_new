import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IOrgaoRepository from '@/modules/orgaos/adapters/orgao_repository.interface';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';
import OrgaoMapper from '@/modules/orgaos/infra/mapper/orgao.mapper';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';

export default class OrgaoRepository implements IOrgaoRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(entity: OrgaoEntity): AsyncResult<AppException, OrgaoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = OrgaoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<OrgaoModel[]>(
        `INSERT INTO "${schema}"."orgaos"
           (id, localidade_id, nome, sigla, tipo, responsavel, email, telefone, ativo, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           localidade_id = EXCLUDED.localidade_id,
           nome = EXCLUDED.nome,
           sigla = EXCLUDED.sigla,
           tipo = EXCLUDED.tipo,
           responsavel = EXCLUDED.responsavel,
           email = EXCLUDED.email,
           telefone = EXCLUDED.telefone,
           ativo = EXCLUDED.ativo,
           updated_at = EXCLUDED.updated_at
         RETURNING id, localidade_id AS "localidadeId", nome, sigla, tipo, responsavel, email, telefone, ativo,
           created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          value.id,
          value.localidadeId,
          value.nome,
          value.sigla,
          value.tipo,
          value.responsavel,
          value.email,
          value.telefone,
          value.ativo,
          value.createdAt,
          value.updatedAt,
        ],
      );
      return right(OrgaoMapper.toEntity(saved));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findById(id: string): AsyncResult<AppException, OrgaoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [found] = await this.dataSource.query<OrgaoModel[]>(
        `SELECT id, localidade_id AS "localidadeId", nome, sigla, tipo, responsavel, email, telefone, ativo,
           created_at AS "createdAt", updated_at AS "updatedAt"
         FROM "${schema}"."orgaos"
         WHERE id = $1`,
        [id],
      );
      return found
        ? right(OrgaoMapper.toEntity(found))
        : left(
            new OrgaoRepositoryException({
              code: ErrorCodeConstants.ORGAO_NOT_FOUND,
              statusCode: 404,
            }),
          );
    } catch (cause) {
      return left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async findAll(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<OrgaoEntity>> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<OrgaoModel[]>(
        `SELECT id, localidade_id AS "localidadeId", nome, sigla, tipo, responsavel, email, telefone, ativo,
           created_at AS "createdAt", updated_at AS "updatedAt"
         FROM "${schema}"."orgaos"
         ORDER BY nome ${pageOptions.order}
         LIMIT $1 OFFSET $2`,
        [pageOptions.take, pageOptions.skip],
      );
      const [countResult] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM "${schema}"."orgaos"`,
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countResult?.count ?? 0),
      });
      return right(
        new PageEntity(
          rows.map((row) => OrgaoMapper.toEntity(row)),
          meta,
        ),
      );
    } catch (cause) {
      return left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async existsLocalidade(
    localidadeId: string,
  ): AsyncResult<AppException, true> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [found] = await this.dataSource.query<{ id: string }[]>(
        `SELECT id FROM "${schema}"."localidades" WHERE id = $1`,
        [localidadeId],
      );
      return found
        ? right(true)
        : left(
            new OrgaoRepositoryException({
              code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
              statusCode: 404,
            }),
          );
    } catch (cause) {
      return left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  private toFailure(cause: unknown): OrgaoRepositoryException {
    if (this.isForeignKeyViolation(cause, 'FK_orgaos_localidades')) {
      return new OrgaoRepositoryException({
        code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
        statusCode: 404,
        cause,
      });
    }
    return new OrgaoRepositoryException({
      code: ErrorCodeConstants.ORGAO_REPOSITORY_FAILED,
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

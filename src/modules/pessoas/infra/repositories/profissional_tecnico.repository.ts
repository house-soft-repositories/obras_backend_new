import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import ProfissionalTecnicoEntity, {
  ConselhoProfissional,
  ProfissionalTecnicoComPessoaProps,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import ProfissionalTecnicoRepositoryException from '@/modules/pessoas/exceptions/profissional_tecnico_repository.exception';
import ProfissionalTecnicoMapper from '@/modules/pessoas/infra/mapper/profissional_tecnico.mapper';
import ProfissionalTecnicoModel from '@/modules/pessoas/infra/models/profissional_tecnico.model';
import { DataSource } from 'typeorm';

const SELECT_COLS = `id, pessoa_id AS "pessoaId", conselho, numero_registro AS "numeroRegistro", uf_registro AS "ufRegistro", titulo, ativo, created_at AS "createdAt", updated_at AS "updatedAt"`;
const VIEW_SELECT_COLS = `pt.id AS id, pt.pessoa_id AS "pessoaId", pt.conselho AS conselho, pt.numero_registro AS "numeroRegistro", pt.uf_registro AS "ufRegistro", pt.titulo AS titulo, pt.ativo AS ativo, pt.created_at AS "createdAt", pt.updated_at AS "updatedAt", p.nome AS nome, p.documento AS documento`;

type ProfissionalTecnicoViewRow = Omit<
  ProfissionalTecnicoComPessoaProps,
  'registro'
>;

export default class ProfissionalTecnicoRepository
  implements IProfissionalTecnicoRepository
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  async save(
    entity: ProfissionalTecnicoEntity,
  ): AsyncResult<AppException, ProfissionalTecnicoEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = ProfissionalTecnicoMapper.toModel(entity);
      const [saved] = await this.dataSource.query<ProfissionalTecnicoModel[]>(
        `INSERT INTO "${schema}"."profissionais_tecnicos"
           (id, pessoa_id, conselho, numero_registro, uf_registro, titulo, ativo, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           conselho = EXCLUDED.conselho,
           numero_registro = EXCLUDED.numero_registro,
           uf_registro = EXCLUDED.uf_registro,
           titulo = EXCLUDED.titulo,
           ativo = EXCLUDED.ativo,
           updated_at = EXCLUDED.updated_at
         RETURNING ${SELECT_COLS}`,
        [
          value.id,
          value.pessoaId,
          value.conselho,
          value.numeroRegistro,
          value.ufRegistro,
          value.titulo,
          value.ativo,
          value.createdAt,
          value.updatedAt,
        ],
      );
      return right(ProfissionalTecnicoMapper.toEntity(saved));
    } catch (cause) {
      return left(this.toFailure(cause));
    }
  }

  async findById(
    id: string,
  ): AsyncResult<AppException, ProfissionalTecnicoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ProfissionalTecnicoModel[]>(
        `SELECT ${SELECT_COLS} FROM "${schema}"."profissionais_tecnicos" WHERE id = $1`,
        [id],
      );
      return right(row ? ProfissionalTecnicoMapper.toEntity(row) : null);
    } catch (cause) {
      return left(this.repositoryFailure(cause));
    }
  }

  async findByPessoaId(
    pessoaId: string,
  ): AsyncResult<AppException, ProfissionalTecnicoEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ProfissionalTecnicoModel[]>(
        `SELECT ${SELECT_COLS} FROM "${schema}"."profissionais_tecnicos" WHERE pessoa_id = $1`,
        [pessoaId],
      );
      return right(row ? ProfissionalTecnicoMapper.toEntity(row) : null);
    } catch (cause) {
      return left(this.repositoryFailure(cause));
    }
  }

  async findViewById(
    id: string,
  ): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<ProfissionalTecnicoViewRow[]>(
        `SELECT ${VIEW_SELECT_COLS}
         FROM "${schema}"."profissionais_tecnicos" pt
         INNER JOIN "${schema}"."pessoas" p ON p.id = pt.pessoa_id
         WHERE pt.id = $1`,
        [id],
      );
      return right(row ? this.toView(row) : null);
    } catch (cause) {
      return left(this.repositoryFailure(cause));
    }
  }

  async findAllViews(): AsyncResult<
    AppException,
    ProfissionalTecnicoComPessoaProps[]
  > {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<ProfissionalTecnicoViewRow[]>(
        `SELECT ${VIEW_SELECT_COLS}
         FROM "${schema}"."profissionais_tecnicos" pt
         INNER JOIN "${schema}"."pessoas" p ON p.id = pt.pessoa_id
         ORDER BY p.nome ASC`,
      );
      return right(rows.map((row) => this.toView(row)));
    } catch (cause) {
      return left(this.repositoryFailure(cause));
    }
  }

  async searchViews(
    pageOptions: PageOptionsEntity,
    query: string,
  ): AsyncResult<AppException, PageEntity<ProfissionalTecnicoComPessoaProps>> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const termo = `%${query.trim()}%`;
      const digitos = query.replace(/\D/g, '');
      const from = `FROM "${schema}"."profissionais_tecnicos" pt INNER JOIN "${schema}"."pessoas" p ON p.id = pt.pessoa_id`;
      const where = `WHERE pt.ativo = true AND (p.nome ILIKE $1 OR pt.numero_registro ILIKE $1 OR ($2 <> '' AND p.documento LIKE $3))`;
      const params = [termo, digitos, `%${digitos}%`];
      const rows = await this.dataSource.query<ProfissionalTecnicoViewRow[]>(
        `SELECT ${VIEW_SELECT_COLS} ${from} ${where} ORDER BY p.nome ${pageOptions.order} LIMIT $4 OFFSET $5`,
        [...params, pageOptions.take, pageOptions.skip],
      );
      const [countResult] = await this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count ${from} ${where}`,
        params,
      );
      const meta = new PageMetaEntity({
        pageOptions,
        itemCount: Number(countResult?.count ?? 0),
      });
      return right(new PageEntity(rows.map((row) => this.toView(row)), meta));
    } catch (cause) {
      return left(this.repositoryFailure(cause));
    }
  }

  private toView(
    row: ProfissionalTecnicoViewRow,
  ): ProfissionalTecnicoComPessoaProps {
    return {
      ...row,
      registro: this.montarRegistro(row),
    };
  }

  private montarRegistro(row: {
    conselho: ConselhoProfissional;
    numeroRegistro: string;
    ufRegistro: string | null;
  }): string {
    return row.ufRegistro
      ? `${row.conselho}-${row.ufRegistro} ${row.numeroRegistro}`
      : `${row.conselho} ${row.numeroRegistro}`;
  }

  private toFailure(cause: unknown): ProfissionalTecnicoRepositoryException {
    if (this.isUniqueViolation(cause, 'UQ_profissionais_tecnicos_pessoa')) {
      return new ProfissionalTecnicoRepositoryException({
        code: ErrorCodeConstants.PROFISSIONAL_TECNICO_DUPLICATE_PESSOA,
        statusCode: 409,
        cause,
      });
    }
    return this.repositoryFailure(cause);
  }

  private repositoryFailure(
    cause: unknown,
  ): ProfissionalTecnicoRepositoryException {
    return new ProfissionalTecnicoRepositoryException({
      code: ErrorCodeConstants.PROFISSIONAL_TECNICO_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }

  private isUniqueViolation(error: unknown, constraint: string): boolean {
    const err = error as Record<string, unknown>;
    const driverErr = (err?.driverError as Record<string, unknown>) ?? err;
    const code = (driverErr?.code as string) ?? (err?.code as string) ?? null;
    const constraintName =
      (driverErr?.constraint as string) ?? (err?.constraint as string) ?? null;
    return code === '23505' && constraintName === constraint;
  }
}

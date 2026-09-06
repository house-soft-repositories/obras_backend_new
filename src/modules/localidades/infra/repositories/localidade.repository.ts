import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ILocalidadeRepository from '@/modules/localidades/adapters/localidade_repository.interface';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeRepositoryException from '@/modules/localidades/exceptions/localidade_repository.exception';
import LocalidadeMapper from '@/modules/localidades/infra/mapper/localidade.mapper';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';

export default class LocalidadeRepository implements ILocalidadeRepository {
  constructor(private readonly dataSource: DataSource, private readonly tenantContext: TenantContext) {}

  async save(entity: LocalidadeEntity): AsyncResult<AppException, LocalidadeEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const value = LocalidadeMapper.toModel(entity);
      const [saved] = await this.dataSource.query<LocalidadeModel[]>(
        `INSERT INTO "${schema}"."localidades" (id, nome, uf, codigo_ibge, tipo, municipio, observacoes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           nome = EXCLUDED.nome,
           uf = EXCLUDED.uf,
           codigo_ibge = EXCLUDED.codigo_ibge,
           tipo = EXCLUDED.tipo,
           municipio = EXCLUDED.municipio,
           observacoes = EXCLUDED.observacoes,
           updated_at = EXCLUDED.updated_at
         RETURNING id, nome, uf, codigo_ibge AS "codigoIbge", tipo, municipio, observacoes, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [value.id, value.nome, value.uf, value.codigoIbge, value.tipo, value.municipio, value.observacoes, value.createdAt, value.updatedAt],
      );
      return right(LocalidadeMapper.toEntity(saved));
    } catch (cause) { return left(new LocalidadeRepositoryException({ code: ErrorCodeConstants.LOCALIDADE_REPOSITORY_FAILED, statusCode: 500, cause })); }
  }

  async findById(id: string): AsyncResult<AppException, LocalidadeEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [found] = await this.dataSource.query<LocalidadeModel[]>(
        `SELECT id, nome, uf, codigo_ibge AS "codigoIbge", tipo, municipio, observacoes, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${schema}"."localidades" WHERE id = $1`, [id],
      );
      return found ? right(LocalidadeMapper.toEntity(found)) : left(new LocalidadeRepositoryException({ code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND, statusCode: 404 }));
    } catch (cause) { return left(new LocalidadeRepositoryException({ code: ErrorCodeConstants.LOCALIDADE_REPOSITORY_FAILED, statusCode: 500, cause })); }
  }

  async findAll(): AsyncResult<AppException, LocalidadeEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<LocalidadeModel[]>(`SELECT id, nome, uf, codigo_ibge AS "codigoIbge", tipo, municipio, observacoes, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${schema}"."localidades" ORDER BY nome ASC`);
      return right(rows.map((row) => LocalidadeMapper.toEntity(row)));
    } catch (cause) { return left(new LocalidadeRepositoryException({ code: ErrorCodeConstants.LOCALIDADE_REPOSITORY_FAILED, statusCode: 500, cause })); }
  }
}

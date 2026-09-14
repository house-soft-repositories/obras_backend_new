import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import EmpresaRepositoryException from '@/modules/contratos/exceptions/empresa_repository.exception';
import EmpresaContratadaMapper from '@/modules/contratos/infra/mapper/empresa_contratada.mapper';
export default class EmpresaContratadaRepository implements IEmpresaContratadaRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  async save(
    e: EmpresaContratadaEntity,
  ): AsyncResult<any, EmpresaContratadaEntity> {
    try {
      const s = this.tc.require().schemaName;
      const o = e.toObject() as any;
      const [saved] = await this.ds.query(
        `INSERT INTO "${s}"."empresa_contratada" (id, tenant_id, razao_social, nome_fantasia, cnpj, responsavel, cargo_responsavel, email, cep, logradouro, numero, complemento, bairro, cidade, uf, ativo, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO UPDATE SET razao_social=EXCLUDED.razao_social, nome_fantasia=EXCLUDED.nome_fantasia, cnpj=EXCLUDED.cnpj, responsavel=EXCLUDED.responsavel, cargo_responsavel=EXCLUDED.cargo_responsavel, email=EXCLUDED.email, cep=EXCLUDED.cep, logradouro=EXCLUDED.logradouro, numero=EXCLUDED.numero, complemento=EXCLUDED.complemento, bairro=EXCLUDED.bairro, cidade=EXCLUDED.cidade, uf=EXCLUDED.uf, ativo=EXCLUDED.ativo, updated_at=EXCLUDED.updated_at RETURNING id, tenant_id as "tenantId", razao_social as "razaoSocial", nome_fantasia as "nomeFantasia", cnpj, responsavel, cargo_responsavel as "cargoResponsavel", email, cep, logradouro, numero, complemento, bairro, cidade, uf, ativo, created_at as "createdAt", updated_at as "updatedAt"`,
        [
          o.id,
          o.tenantId,
          o.razaoSocial,
          o.nomeFantasia,
          o.cnpj,
          o.responsavel,
          o.cargoResponsavel,
          o.email,
          o.cep,
          o.logradouro,
          o.numero,
          o.complemento,
          o.bairro,
          o.cidade,
          o.uf,
          o.ativo,
          o.createdAt,
          o.updatedAt,
        ],
      );
      await this.ds.query(`DELETE FROM "${s}"."empresa_contratada_telefone" WHERE empresa_contratada_id=$1`, [o.id]);
      for (const telefone of o.telefones as string[]) {
        await this.ds.query(
          `INSERT INTO "${s}"."empresa_contratada_telefone" (id, tenant_id, empresa_contratada_id, numero, created_at) VALUES ($1,$2,$3,$4,$5)`,
          [require('node:crypto').randomUUID(), o.tenantId, o.id, telefone, new Date()],
        );
      }
      saved.telefones = o.telefones;
      return right(EmpresaContratadaMapper.toEntity(saved));
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async findById(id: string): AsyncResult<any, EmpresaContratadaEntity | null> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const [row] = await this.ds.query(
        `SELECT id, tenant_id as "tenantId", razao_social as "razaoSocial", nome_fantasia as "nomeFantasia", cnpj, responsavel, cargo_responsavel as "cargoResponsavel", email, cep, logradouro, numero, complemento, bairro, cidade, uf, ativo, created_at as "createdAt", updated_at as "updatedAt" FROM "${s}"."empresa_contratada" WHERE id=$1 AND tenant_id=$2`,
        [id, ctx.tenantId],
      );
      if (!row) return right(null);
      const telefones = await this.ds.query(`SELECT numero FROM "${s}"."empresa_contratada_telefone" WHERE empresa_contratada_id=$1 ORDER BY created_at ASC`, [id]);
      row.telefones = telefones.map((telefone: { numero: string }) => telefone.numero);
      return right(EmpresaContratadaMapper.toEntity(row));
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async findPage(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<any, PageEntity<EmpresaContratadaEntity>> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const totalRows = await this.ds.query(
        `SELECT COUNT(*) as count FROM "${s}"."empresa_contratada" WHERE tenant_id=$1`,
        [ctx.tenantId],
      );
      const total = Number(totalRows[0]?.count ?? 0);
      const rows = await this.ds.query(
        `SELECT e.id, e.tenant_id as "tenantId", e.razao_social as "razaoSocial", e.nome_fantasia as "nomeFantasia", e.cnpj, e.responsavel, e.cargo_responsavel as "cargoResponsavel", e.email, e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.uf, e.ativo, e.created_at as "createdAt", e.updated_at as "updatedAt", COUNT(c.id)::int as "totalContratos" FROM "${s}"."empresa_contratada" e LEFT JOIN "${s}"."contrato" c ON c.empresa_contratada_id=e.id WHERE e.tenant_id=$1 GROUP BY e.id ORDER BY e.razao_social ASC LIMIT $2 OFFSET $3`,
        [ctx.tenantId, pageOptions.take, pageOptions.skip],
      );
      const items = rows.map((r: any) => EmpresaContratadaMapper.toEntity(r));
      return right(
        new PageEntity(
          items,
          new PageMetaEntity({ pageOptions, itemCount: total }),
        ),
      );
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async existsCnpj(cnpj: string, excludeId?: string): AsyncResult<any, boolean> {
    try {
      const s = this.tc.require().schemaName;
      const ctx = this.tc.require();
      const rows = await this.ds.query(
        `SELECT id FROM "${s}"."empresa_contratada" WHERE cnpj=$1 AND tenant_id=$2 AND ($3::uuid IS NULL OR id<>$3)`,
        [cnpj, ctx.tenantId, excludeId ?? null],
      );
      return right(rows.length > 0);
    } catch (cause) {
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async delete(id: string): AsyncResult<any, void> {
    try {
      const ctx = this.tc.require();
      await this.ds.query(`DELETE FROM "${ctx.schemaName}"."empresa_contratada" WHERE id=$1 AND tenant_id=$2`, [id, ctx.tenantId]);
      return right(undefined);
    } catch (cause) {
      return left(new EmpresaRepositoryException({ code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
}

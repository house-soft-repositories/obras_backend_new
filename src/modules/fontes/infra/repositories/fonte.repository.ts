import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import FonteMapper from '@/modules/fontes/infra/mapper/fonte.mapper';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import FonteRepositoryException from '@/modules/fontes/exceptions/fonte_repository.exception';

export default class FonteRepository implements IFonteRepository {
  constructor(private readonly dataSource: DataSource, private readonly tenantContext: TenantContext) {}
  async save(entity: FonteEntity): AsyncResult<AppException, FonteEntity> {
    try {
      const schema=this.tenantContext.require().schemaName;
      const v=FonteMapper.toModel(entity) as any;
      const [saved]=await this.dataSource.query<FonteModel[]>(
        `INSERT INTO "${schema}"."fontes" (id, nome, descricao, codigo, tipo, valor_previsto, vigencia, ativo, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome, descricao=EXCLUDED.descricao, codigo=EXCLUDED.codigo, tipo=EXCLUDED.tipo, valor_previsto=EXCLUDED.valor_previsto, vigencia=EXCLUDED.vigencia, ativo=EXCLUDED.ativo, updated_at=EXCLUDED.updated_at RETURNING id, nome, descricao, codigo, tipo, valor_previsto AS "valorPrevisto", vigencia, ativo, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [v.id,v.nome,v.descricao,v.codigo,v.tipo,v.valorPrevisto,v.vigencia,v.ativo,v.createdAt,v.updatedAt]
      );
      return right(FonteMapper.toEntity(saved as any));
    } catch(cause:any){
      if(cause?.code==='23505') return left(new FonteRepositoryException({code:ErrorCodeConstants.FONTE_DUPLICATE_CODE,statusCode:409,cause}));
      return left(new FonteRepositoryException({code:ErrorCodeConstants.FONTE_REPOSITORY_FAILED,statusCode:500,cause}));
    }
  }
  async findByCodigo(codigo:string): AsyncResult<AppException, FonteEntity | null>{
    try{
      const schema=this.tenantContext.require().schemaName;
      const [row]=await this.dataSource.query<FonteModel[]>(`SELECT id, nome, descricao, codigo, tipo, valor_previsto AS "valorPrevisto", vigencia, ativo, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${schema}"."fontes" WHERE codigo=$1`,[codigo]);
      return right(row?FonteMapper.toEntity(row as any):null);
    } catch(cause){ return left(new FonteRepositoryException({code:ErrorCodeConstants.FONTE_REPOSITORY_FAILED,statusCode:500,cause})); }
  }
  async findById(id:string): AsyncResult<AppException, FonteEntity | null>{
    try{
      const schema=this.tenantContext.require().schemaName;
      const [row]=await this.dataSource.query<FonteModel[]>(`SELECT id, nome, descricao, codigo, tipo, valor_previsto AS "valorPrevisto", vigencia, ativo, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${schema}"."fontes" WHERE id=$1`,[id]);
      return right(row?FonteMapper.toEntity(row as any):null);
    } catch(cause){ return left(new FonteRepositoryException({code:ErrorCodeConstants.FONTE_REPOSITORY_FAILED,statusCode:500,cause})); }
  }
  async findAll(pageOptions: PageOptionsEntity): AsyncResult<AppException, PageEntity<FonteEntity>>{
    try{
      const schema=this.tenantContext.require().schemaName;
      const rows=await this.dataSource.query<FonteModel[]>(`SELECT id, nome, descricao, codigo, tipo, valor_previsto AS "valorPrevisto", vigencia, ativo, created_at AS "createdAt", updated_at AS "updatedAt" FROM "${schema}"."fontes" ORDER BY nome ${pageOptions.order} LIMIT $1 OFFSET $2`,[pageOptions.take, pageOptions.skip]);
      const [countResult]=await this.dataSource.query<{count:string}[]>(`SELECT COUNT(*)::int AS count FROM "${schema}"."fontes"`);
      const meta=new PageMetaEntity({pageOptions,itemCount:Number(countResult?.count??0)});
      return right(new PageEntity(rows.map(r=>FonteMapper.toEntity(r as any)),meta));
    } catch(cause){ return left(new FonteRepositoryException({code:ErrorCodeConstants.FONTE_REPOSITORY_FAILED,statusCode:500,cause})); }
  }
}

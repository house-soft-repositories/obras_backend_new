import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import PessoaMapper from '@/modules/pessoas/infra/mapper/pessoa.mapper';
import PessoaModel from '@/modules/pessoas/infra/models/pessoa.model';
import PessoaRepositoryException from '@/modules/pessoas/exceptions/pessoa_repository.exception';
export default class PessoaRepository implements IPessoaRepository {
  constructor(private readonly ds:DataSource, private readonly tc:TenantContext){}
  async save(e:PessoaEntity):AsyncResult<AppException,PessoaEntity>{
    try{
      const schema=this.tc.require().schemaName; const v=PessoaMapper.toModel(e) as any;
      const [s]=await this.ds.query<PessoaModel[]>(`INSERT INTO "${schema}"."pessoas" (id,tipo,documento,nome,nome_fantasia,rg,orgao_expedidor,email,telefone,cep,logradouro,numero,complemento,bairro,cidade,uf,ativo,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) ON CONFLICT (id) DO UPDATE SET tipo=EXCLUDED.tipo,documento=EXCLUDED.documento,nome=EXCLUDED.nome,updated_at=EXCLUDED.updated_at RETURNING id,tipo,documento,nome,nome_fantasia AS "nomeFantasia",rg,orgao_expedidor AS "orgaoExpedidor",email,telefone,cep,logradouro,numero,complemento,bairro,cidade,uf,ativo,created_at AS "createdAt",updated_at AS "updatedAt"`,[v.id,v.tipo,v.documento,v.nome,v.nomeFantasia,v.rg,v.orgaoExpedidor,v.email,v.telefone,v.cep,v.logradouro,v.numero,v.complemento,v.bairro,v.cidade,v.uf,v.ativo,v.createdAt,v.updatedAt]);
      return right(PessoaMapper.toEntity(s as any));
    }catch(cause:any){ if(cause?.code==='23505') return left(new PessoaRepositoryException({code:ErrorCodeConstants.PESSOA_DUPLICATE_DOCUMENTO,statusCode:409,cause})); return left(new PessoaRepositoryException({code:ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,statusCode:500,cause})); }
  }
  async findByDocumento(d:string):AsyncResult<AppException,PessoaEntity|null>{ try{ const schema=this.tc.require().schemaName; const [r]=await this.ds.query<PessoaModel[]>(`SELECT id,tipo,documento,nome,nome_fantasia AS "nomeFantasia",rg,orgao_expedidor AS "orgaoExpedidor",email,telefone,cep,logradouro,numero,complemento,bairro,cidade,uf,ativo,created_at AS "createdAt",updated_at AS "updatedAt" FROM "${schema}"."pessoas" WHERE documento=$1`,[d]); return right(r?PessoaMapper.toEntity(r as any):null);}catch(cause){ return left(new PessoaRepositoryException({code:ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,statusCode:500,cause})); } }
  async findById(id:string):AsyncResult<AppException,PessoaEntity|null>{ try{ const schema=this.tc.require().schemaName; const [r]=await this.ds.query<PessoaModel[]>(`SELECT id,tipo,documento,nome,nome_fantasia AS "nomeFantasia",rg,orgao_expedidor AS "orgaoExpedidor",email,telefone,cep,logradouro,numero,complemento,bairro,cidade,uf,ativo,created_at AS "createdAt",updated_at AS "updatedAt" FROM "${schema}"."pessoas" WHERE id=$1`,[id]); return right(r?PessoaMapper.toEntity(r as any):null);}catch(cause){ return left(new PessoaRepositoryException({code:ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,statusCode:500,cause})); } }
  async findAll(o:PageOptionsEntity):AsyncResult<AppException,PageEntity<PessoaEntity>>{ try{ const schema=this.tc.require().schemaName; const rows=await this.ds.query<PessoaModel[]>(`SELECT id,tipo,documento,nome,nome_fantasia AS "nomeFantasia",rg,orgao_expedidor AS "orgaoExpedidor",email,telefone,cep,logradouro,numero,complemento,bairro,cidade,uf,ativo,created_at AS "createdAt",updated_at AS "updatedAt" FROM "${schema}"."pessoas" ORDER BY nome ${o.order} LIMIT $1 OFFSET $2`,[o.take,o.skip]); const [c]=await this.ds.query<{count:string}[]>(`SELECT COUNT(*)::int AS count FROM "${schema}"."pessoas"`); const meta=new PageMetaEntity({pageOptions:o,itemCount:Number(c?.count??0)}); return right(new PageEntity(rows.map(r=>PessoaMapper.toEntity(r as any)),meta)); }catch(cause){ return left(new PessoaRepositoryException({code:ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,statusCode:500,cause})); } }
}

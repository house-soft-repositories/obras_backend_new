import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraMapper from '@/modules/obras/infra/mapper/obra.mapper';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
export default class ObraRepository implements IObraRepository {
  constructor(private readonly ds:DataSource, private readonly tc:TenantContext){}
  async save(e:ObraEntity):AsyncResult<AppException,ObraEntity>{
    try{ const s=this.tc.require().schemaName; const v=ObraMapper.toModel(e) as any;
      const [saved]=await this.ds.query<ObraModel[]>(`INSERT INTO "${s}"."obras" (id,codigo,nome,descricao,tipo,status,orgao_id,setor_id,localidade_id,subclassificacao_id,eixo_id,classificacao_id,tipologia_id,subtipologia_id,seguir_automatico,criado_por_usuario_id,created_at,updated_at,deleted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=EXCLUDED.updated_at RETURNING id,codigo,nome,descricao,tipo,status,orgao_id AS "orgaoId",setor_id AS "setorId",localidade_id AS "localidadeId",subclassificacao_id AS "subclassificacaoId",eixo_id AS "eixoId",classificacao_id AS "classificacaoId",tipologia_id AS "tipologiaId",subtipologia_id AS "subtipologiaId",seguir_automatico AS "seguirAutomatico",criado_por_usuario_id AS "criadoPorUsuarioId",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt"`,[v.id,v.codigo,v.nome,v.descricao,v.tipo,v.status,v.orgaoId,v.setorId,v.localidadeId,v.subclassificacaoId,v.eixoId,v.classificacaoId,v.tipologiaId,v.subtipologiaId,v.seguirAutomatico,v.criadoPorUsuarioId,v.createdAt,v.updatedAt,v.deletedAt]);
      return right(ObraMapper.toEntity(saved as any));
    }catch(cause:any){ if(cause?.code==='23505') return left(new ObraRepositoryException({code:ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,statusCode:409,cause})); return left(new ObraRepositoryException({code:ErrorCodeConstants.OBRA_REPOSITORY_FAILED,statusCode:500,cause})); }
  }
  async findLastCodigo(year:number):AsyncResult<AppException,string|null>{
    try{ const s=this.tc.require().schemaName; const prefix=`OBR-${year}-`; const [row]=await this.ds.query<{codigo:string}[]>(`SELECT codigo FROM "${s}"."obras" WHERE codigo LIKE $1 ORDER BY codigo DESC LIMIT 1`,[`${prefix}%`]); return right(row?.codigo??null); }catch(cause){ return left(new ObraRepositoryException({code:ErrorCodeConstants.OBRA_REPOSITORY_FAILED,statusCode:500,cause})); }
  }
  async findById(id:string):AsyncResult<AppException,ObraEntity|null>{ try{ const s=this.tc.require().schemaName; const [r]=await this.ds.query<ObraModel[]>(`SELECT id,codigo,nome,descricao,tipo,status,orgao_id AS "orgaoId",setor_id AS "setorId",localidade_id AS "localidadeId",subclassificacao_id AS "subclassificacaoId",eixo_id AS "eixoId",classificacao_id AS "classificacaoId",tipologia_id AS "tipologiaId",subtipologia_id AS "subtipologiaId",seguir_automatico AS "seguirAutomatico",criado_por_usuario_id AS "criadoPorUsuarioId",created_at AS "createdAt",updated_at AS "updatedAt",deleted_at AS "deletedAt" FROM "${s}"."obras" WHERE id=$1`,[id]); return right(r?ObraMapper.toEntity(r as any):null);}catch(cause){ return left(new ObraRepositoryException({code:ErrorCodeConstants.OBRA_REPOSITORY_FAILED,statusCode:500,cause})); } }
}

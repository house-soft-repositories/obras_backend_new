import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import { DataSource } from 'typeorm';
import TenantContext from '@/core/multitenancy/tenant_context';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { ObraOrcamentoPrevistoEntity, ObraResponsavelEntity, ObraSeguidorEntity } from '@/modules/obras/domain/entities/obra_items.entity';
import ICreateObraUseCase, { CreateObraParam } from '@/modules/obras/domain/usecase/create_obra.usecase';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import ObraServiceException from '@/modules/obras/exceptions/obra_service.exception';
import { proximoCodigo } from '@/modules/obras/services/codigo_obra.service';
export default class CreateObraService implements ICreateObraUseCase {
  constructor(private readonly obraRepo:IObraRepository, private readonly fonteRepo:IFonteRepository, private readonly ds:DataSource, private readonly tc:TenantContext){}
  async execute(p:CreateObraParam):AsyncResult<AppException,ObraEntity>{
    try{
      if(!p.orcamentos||p.orcamentos.length<1) return left(new ObraDomainException({code:ErrorCodeConstants.OBRA_INVALID_ORCAMENTO}));
      if(p.subclassificacaoId && p.tipo!=='OBRA') return left(new ObraDomainException({code:ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO}));
      for(const o of p.orcamentos){
        const f=await this.fonteRepo.findById(o.fonteId);
        if(f.isLeft()) return left(f.value);
        if(!f.value) return left(new ObraServiceException({code:ErrorCodeConstants.OBRA_FONTE_INATIVA,statusCode:422}));
        if(!f.value.ativo) return left(new ObraServiceException({code:ErrorCodeConstants.OBRA_FONTE_INATIVA,statusCode:422}));
      }
      const year=new Date().getFullYear();
      let codigo:string|null=null;
      for(let attempt=0; attempt<3; attempt++){
        const last=await this.obraRepo.findLastCodigo(year);
        if(last.isLeft()) return left(last.value);
        codigo=proximoCodigo('OBR', last.value, year);
        const entity=ObraEntity.create({ tenantId:p.tenantId, codigo, nome:p.nome, descricao:p.descricao, tipo:p.tipo, orgaoId:p.orgaoId, setorId:p.setorId, localidadeId:p.localidadeId, subclassificacaoId:p.subclassificacaoId, eixoId:p.eixoId, classificacaoId:p.classificacaoId, tipologiaId:p.tipologiaId, subtipologiaId:p.subtipologiaId, seguirAutomatico:p.seguirAutomatico, criadoPorUsuarioId:p.criadoPorUsuarioId });
        const schema=this.tc.require().schemaName;
        try{
          const saved=await this.ds.transaction(async m=>{
            const obra=await m.query(`INSERT INTO "${schema}"."obras" (id,codigo,nome,descricao,tipo,status,orgao_id,setor_id,localidade_id,subclassificacao_id,eixo_id,classificacao_id,tipologia_id,subtipologia_id,seguir_automatico,criado_por_usuario_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,[entity.toObject().id, codigo, entity.toObject().nome, entity.toObject().descricao, entity.toObject().tipo, 'EM_ABERTO', entity.toObject().orgaoId, entity.toObject().setorId, entity.toObject().localidadeId, entity.toObject().subclassificacaoId, entity.toObject().eixoId, entity.toObject().classificacaoId, entity.toObject().tipologiaId, entity.toObject().subtipologiaId, entity.toObject().seguirAutomatico, entity.toObject().criadoPorUsuarioId, entity.toObject().createdAt, entity.toObject().updatedAt]);
            const obraId=obra[0].id;
            const resp=ObraResponsavelEntity.createResponsible({tenantId:p.tenantId,obraId,usuarioId:p.responsavelUsuarioId});
            await m.query(`INSERT INTO "${schema}"."obra_responsaveis" (id,tenant_id,obra_id,usuario_id,tipo,created_at) VALUES ($1,$2,$3,$4,$5,$6)`,[resp.toObject().id, p.tenantId, obraId, p.responsavelUsuarioId, 'RESPONSAVEL', resp.toObject().createdAt]);
            for(const o of p.orcamentos){
              const orc=ObraOrcamentoPrevistoEntity.create({tenantId:p.tenantId,obraId,fonteId:o.fonteId,valor:o.valor});
              await m.query(`INSERT INTO "${schema}"."obra_orcamentos" (id,tenant_id,obra_id,fonte_id,valor) VALUES ($1,$2,$3,$4,$5)`,[orc.toObject().id,p.tenantId,obraId,o.fonteId,o.valor]);
            }
            if(entity.toObject().seguirAutomatico){
              const seg=ObraSeguidorEntity.create({tenantId:p.tenantId,obraId,usuarioId:p.criadoPorUsuarioId});
              await m.query(`INSERT INTO "${schema}"."obra_seguidores" (id,tenant_id,obra_id,usuario_id,seguido_em) VALUES ($1,$2,$3,$4,$5)`,[seg.toObject().id,p.tenantId,obraId,p.criadoPorUsuarioId,seg.toObject().seguidoEm]);
            }
            return entity;
          });
          return { isLeft:()=>false, isRight:()=>true, value:saved } as any;
        }catch(e:any){
          if(e?.code==='23505' && String(e?.constraint||'').includes('codigo')) continue;
          throw e;
        }
      }
      return left(new ObraServiceException({code:ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,statusCode:409}));
    }catch(e){ if(e instanceof ObraDomainException) return left(e); if(e instanceof AppException) return left(e); return left(new ObraServiceException({code:ErrorCodeConstants.OBRA_CREATE_FAILED,statusCode:500,cause:e})); }
  }
}

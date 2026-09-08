import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { CREATE_OBRA_SERVICE } from '@/modules/obras/symbols';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import type { ITokenService } from '@/modules/auth/adapters/token_service.interface';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import { AppModule } from '@/app.module';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';

describe('Obras (públicas) API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let createObra: { execute: jest.Mock };
  const tenantId='9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc'; const userId='4c67eb4d-b04d-435d-9435-5f1a8d026cf8';
  const tokenFor=(role:UserRole=UserRole.ADMIN)=>{ tokenService.verifyAccess.mockResolvedValue({ sub:userId, type:'access', role, tenantId } as any); };
  const obra=(codigo='OBR-2026-0001')=> ObraEntity.create({ tenantId, codigo, nome:'Reforma Escola', tipo:'OBRA', orgaoId:'org-1', criadoPorUsuarioId:userId } as any);
  beforeEach(async()=>{
    tokenService={ signAccess:jest.fn(), signRefresh:jest.fn(), verifyAccess:jest.fn(), verifyRefresh:jest.fn() } as any;
    createObra={ execute:jest.fn() };
    const trc:Pick<TenantRequestContextService,'run'>={ run:jest.fn(<T>(u:AccessTokenPayload|undefined, cb:()=>Promise<T>)=>{ if(!u||!u.tenantId) throw new TenantContextException(); return cb(); }) };
    const mf:TestingModule=await Test.createTestingModule({ imports:[AppModule] }).overrideProvider(TOKEN_SERVICE).useValue(tokenService).overrideProvider(CREATE_OBRA_SERVICE).useValue(createObra).overrideProvider(TenantRequestContextService).useValue(trc).compile();
    app=mf.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ transform:true, whitelist:true, forbidNonWhitelisted:true })); await app.init();
  });
  afterEach(async()=>{ if(app) await app.close(); });
  it('creates public obra 201 with OBR code', async()=>{
    tokenFor(); const e=obra(); createObra.execute.mockResolvedValue(right(e));
    const res=await request(app.getHttpServer()).post('/api/obras').set('Authorization','Bearer token').send({ nome:'Reforma Escola', tipo:'OBRA', responsavelUsuarioId:'550e8400-e29b-41d4-a716-446655440000', orgaoId:'6ba7b810-9dad-11d1-80b4-00c04fd430c8', orcamentos:[{ fonteId:'7d444840-9dc0-11d1-b245-5ffd4e1a6a6a', valor:'10000.00' }] }).expect(201);
    expect(res.body.codigo).toMatch(/^OBR-\d{4}-0001$/);
    expect(createObra.execute).toHaveBeenCalledWith(expect.objectContaining({ nome:'Reforma Escola', tenantId }));
  });
  it('rejects codigo in payload via whitelist 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/obras').set('Authorization','Bearer token').send({ nome:'Obra', tipo:'OBRA', responsavelUsuarioId:'550e8400-e29b-41d4-a716-446655440000', orgaoId:'6ba7b810-9dad-11d1-80b4-00c04fd430c8', codigo:'OBR-2026-9999', orcamentos:[{ fonteId:'7d444840-9dc0-11d1-b245-5ffd4e1a6a6a', valor:'100' }] }).expect(400);
    expect(createObra.execute).not.toHaveBeenCalled();
  });
  it('rejects empty orcamentos 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/obras').set('Authorization','Bearer token').send({ nome:'Obra', tipo:'OBRA', responsavelUsuarioId:'550e8400-e29b-41d4-a716-446655440000', orgaoId:'6ba7b810-9dad-11d1-80b4-00c04fd430c8', orcamentos:[] }).expect(400);
  });
  it('rejects subclassificacao when tipo != OBRA via service 422', async()=>{
    tokenFor(); createObra.execute.mockResolvedValue(left({ code:ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO, statusCode:422, message:'invalid' } as any));
    await request(app.getHttpServer()).post('/api/obras').set('Authorization','Bearer token').send({ nome:'Obra', tipo:'REFORMA', responsavelUsuarioId:'550e8400-e29b-41d4-a716-446655440000', orgaoId:'6ba7b810-9dad-11d1-80b4-00c04fd430c8', subclassificacaoId:'6ba7b811-9dad-11d1-80b4-00c04fd430c8', orcamentos:[{ fonteId:'7d444840-9dc0-11d1-b245-5ffd4e1a6a6a', valor:'100' }] }).expect(422);
  });
  it('maps fonte inativa to 422', async()=>{
    tokenFor(); createObra.execute.mockResolvedValue(left({ code:ErrorCodeConstants.OBRA_FONTE_INATIVA, statusCode:422, message:'inativa' } as any));
    await request(app.getHttpServer()).post('/api/obras').set('Authorization','Bearer token').send({ nome:'Obra', tipo:'OBRA', responsavelUsuarioId:'550e8400-e29b-41d4-a716-446655440000', orgaoId:'6ba7b810-9dad-11d1-80b4-00c04fd430c8', orcamentos:[{ fonteId:'7d444840-9dc0-11d1-b245-5ffd4e1a6a6a', valor:'100' }] }).expect(422);
  });
  it('rejects unknown fields 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/obras').set('Authorization','Bearer token').send({ nome:'Obra', tipo:'OBRA', responsavelUsuarioId:'550e8400-e29b-41d4-a716-446655440000', orgaoId:'6ba7b810-9dad-11d1-80b4-00c04fd430c8', unknown:'x', orcamentos:[{ fonteId:'7d444840-9dc0-11d1-b245-5ffd4e1a6a6a', valor:'100' }] }).expect(400);
  });
});

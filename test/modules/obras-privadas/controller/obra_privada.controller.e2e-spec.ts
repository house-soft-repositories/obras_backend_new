import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import { CREATE_OBRA_PRIVADA_SERVICE } from '@/modules/obras-privadas/symbols';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import type { ITokenService } from '@/modules/auth/adapters/token_service.interface';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import { AppModule } from '@/app.module';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';

describe('Obras Privadas API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let create: { execute: jest.Mock };
  const tenantId='9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc'; const userId='4c67eb4d-b04d-435d-9435-5f1a8d026cf8';
  const tokenFor=(role:UserRole=UserRole.ADMIN)=>{ tokenService.verifyAccess.mockResolvedValue({ sub:userId, type:'access', role, tenantId } as any); };
  const make=(codigo='OBP-2026-0001')=> ObraPrivadaEntity.create({ tenantId, codigo, descricao:'Construção Residencial', proprietarioPessoaId:'p1', logradouro:'Rua A', uf:'PI', inscricaoImobiliaria:'123', latitude:'-5.09', longitude:'-42.8' } as any);
  beforeEach(async()=>{
    tokenService={ signAccess:jest.fn(), signRefresh:jest.fn(), verifyAccess:jest.fn(), verifyRefresh:jest.fn() } as any;
    create={ execute:jest.fn() };
    const trc:Pick<TenantRequestContextService,'run'>={ run:jest.fn(<T>(u:AccessTokenPayload|undefined, cb:()=>Promise<T>)=>{ if(!u||!u.tenantId) throw new TenantContextException(); return cb(); }) };
    const mf:TestingModule=await Test.createTestingModule({ imports:[AppModule] }).overrideProvider(TOKEN_SERVICE).useValue(tokenService).overrideProvider(CREATE_OBRA_PRIVADA_SERVICE).useValue(create).overrideProvider(TenantRequestContextService).useValue(trc).compile();
    app=mf.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ transform:true, whitelist:true, forbidNonWhitelisted:true })); await app.init();
  });
  afterEach(async()=>{ if(app) await app.close(); });
  it('creates private obra 201 with OBP code and SEM_ALVARA', async()=>{
    tokenFor(); const e=make(); create.execute.mockResolvedValue(right(e));
    const res=await request(app.getHttpServer()).post('/api/obras-privadas').set('Authorization','Bearer token').send({ descricao:'Construção Residencial', proprietarioPessoaId:'550e8400-e29b-41d4-a716-446655440000', logradouro:'Rua A', uf:'PI', inscricaoImobiliaria:'123', latitude:'-5.09', longitude:'-42.8', dataInicio:'2026-01-01' }).expect(201);
    expect(res.body.codigo).toMatch(/^OBP-\d{4}-0001$/); expect(res.body.situacaoAlvara).toBe('SEM_ALVARA');
    expect(create.execute).toHaveBeenCalledWith(expect.objectContaining({ descricao:'Construção Residencial', uf:'PI', tenantId }));
  });
  it('rejects codigo in payload 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/obras-privadas').set('Authorization','Bearer token').send({ descricao:'X', proprietarioPessoaId:'550e8400-e29b-41d4-a716-446655440000', logradouro:'Rua A', uf:'PI', codigo:'OBP-2026-9999' }).expect(400);
    expect(create.execute).not.toHaveBeenCalled();
  });
  it('rejects invalid UF 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/obras-privadas').set('Authorization','Bearer token').send({ descricao:'X', proprietarioPessoaId:'550e8400-e29b-41d4-a716-446655440000', logradouro:'Rua A', uf:'P' }).expect(400);
  });
  it('maps proprietario not found to 422', async()=>{
    tokenFor(); create.execute.mockResolvedValue(left({ code:ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO, statusCode:422, message:'not found' } as any));
    await request(app.getHttpServer()).post('/api/obras-privadas').set('Authorization','Bearer token').send({ descricao:'X', proprietarioPessoaId:'550e8400-e29b-41d4-a716-446655440000', logradouro:'Rua A', uf:'PI' }).expect(422);
  });
  it('persists geo fields via service', async()=>{
    tokenFor(); const e=make(); create.execute.mockResolvedValue(right(e));
    await request(app.getHttpServer()).post('/api/obras-privadas').set('Authorization','Bearer token').send({ descricao:'X', proprietarioPessoaId:'550e8400-e29b-41d4-a716-446655440000', logradouro:'Rua A', uf:'PI', latitude:'-5.09', longitude:'-42.8', geoOrigem:'GPS' }).expect(201);
    expect(create.execute).toHaveBeenCalledWith(expect.objectContaining({ latitude:'-5.09', longitude:'-42.8', geoOrigem:'GPS' }));
  });
  it('rejects unknown fields 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/obras-privadas').set('Authorization','Bearer token').send({ descricao:'X', proprietarioPessoaId:'550e8400-e29b-41d4-a716-446655440000', logradouro:'Rua A', uf:'PI', unknown:'x' }).expect(400);
  });
});

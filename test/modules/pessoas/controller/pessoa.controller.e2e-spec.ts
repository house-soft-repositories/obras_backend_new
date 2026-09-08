import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import { CREATE_PESSOA_SERVICE, LIST_PESSOAS_SERVICE } from '@/modules/pessoas/symbols';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import { TOKEN_SERVICE } from '@/modules/auth/symbols';
import type { ITokenService } from '@/modules/auth/adapters/token_service.interface';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import { AppModule } from '@/app.module';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';

describe('Pessoas API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let createPessoa: { execute: jest.Mock };
  let listPessoas: { execute: jest.Mock };
  const tenantId = '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc';
  const userId = '4c67eb4d-b04d-435d-9435-5f1a8d026cf8';
  const tokenFor = (role: UserRole = UserRole.ADMIN) => {
    tokenService.verifyAccess.mockResolvedValue({ sub:userId, type:'access', role, tenantId } as AccessTokenPayload);
  };
  const pessoa = (nome:string, doc:string) => PessoaEntity.create({ tenantId, tipo:'FISICA', documento:doc, nome } as any);
  beforeEach(async()=>{
    tokenService={ signAccess:jest.fn(), signRefresh:jest.fn(), verifyAccess:jest.fn(), verifyRefresh:jest.fn() } as any;
    createPessoa={ execute:jest.fn() }; listPessoas={ execute:jest.fn() };
    const trc:Pick<TenantRequestContextService,'run'>={ run:jest.fn(<T>(u:AccessTokenPayload|undefined, cb:()=>Promise<T>)=>{ if(!u||!u.tenantId) throw new TenantContextException(); return cb(); }) };
    const mf:TestingModule=await Test.createTestingModule({ imports:[AppModule] }).overrideProvider(TOKEN_SERVICE).useValue(tokenService).overrideProvider(CREATE_PESSOA_SERVICE).useValue(createPessoa).overrideProvider(LIST_PESSOAS_SERVICE).useValue(listPessoas).overrideProvider(TenantRequestContextService).useValue(trc).compile();
    app=mf.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ transform:true, whitelist:true, forbidNonWhitelisted:true })); await app.init();
  });
  afterEach(async()=>{ if(app) await app.close(); });
  it('creates pessoa 201', async()=>{
    tokenFor(); const e=pessoa('João Silva','12345678901'); createPessoa.execute.mockResolvedValue(right(e));
    const res=await request(app.getHttpServer()).post('/api/pessoas').set('Authorization','Bearer token').send({ tipo:'FISICA', documento:'12345678901', nome:' João Silva ' }).expect(201);
    expect(res.body).toMatchObject({ nome:'João Silva', documento:'12345678901' });
    expect(createPessoa.execute).toHaveBeenCalledWith(expect.objectContaining({ nome:'João Silva', tenantId }));
  });
  it('rejects duplicate documento 409', async()=>{
    tokenFor(); createPessoa.execute.mockResolvedValue(left({ code:ErrorCodeConstants.PESSOA_DUPLICATE_DOCUMENTO, statusCode:409, message:'dup' } as any));
    await request(app.getHttpServer()).post('/api/pessoas').set('Authorization','Bearer token').send({ tipo:'FISICA', documento:'12345678901', nome:'Maria' }).expect(409);
  });
  it('rejects invalid documento 400 via DTO/entity', async()=>{
    tokenFor(); createPessoa.execute.mockResolvedValue(left({ code: ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO, statusCode:400, message:'invalid' } as any));
    await request(app.getHttpServer()).post('/api/pessoas').set('Authorization','Bearer token').send({ tipo:'FISICA', documento:'123', nome:'João' }).expect(400);
  });
  it('rejects unknown fields 400', async()=>{
    tokenFor();
    await request(app.getHttpServer()).post('/api/pessoas').set('Authorization','Bearer token').send({ tipo:'FISICA', documento:'12345678901', nome:'João', unknown:'x' }).expect(400);
  });
  it('lists pessoas paginated data/meta', async()=>{
    tokenFor(); const page=new PageEntity([pessoa('A Pessoa','11111111111'), pessoa('Z Pessoa','22222222222')], new PageMetaEntity({ pageOptions:new PageOptionsEntity('ASC',1,10), itemCount:2 })); listPessoas.execute.mockResolvedValue(right(page));
    const res=await request(app.getHttpServer()).get('/api/pessoas?page=1&take=10').set('Authorization','Bearer token').expect(200);
    expect(res.body.data.map((x:any)=>x.nome)).toEqual(['A Pessoa','Z Pessoa']); expect(res.body.meta).toBeDefined();
  });
  it('uses defaults when pagination absent', async()=>{
    tokenFor(); const page=new PageEntity([pessoa('A Pessoa','11111111111')], new PageMetaEntity({ pageOptions:new PageOptionsEntity('ASC',1,10), itemCount:1 })); listPessoas.execute.mockResolvedValue(right(page));
    await request(app.getHttpServer()).get('/api/pessoas').set('Authorization','Bearer token').expect(200);
    expect(listPessoas.execute).toHaveBeenCalledWith(expect.objectContaining({ page:1, take:10 }));
  });
  it('rejects invalid pagination 400', async()=>{
    tokenFor(); await request(app.getHttpServer()).get('/api/pessoas?page=0&take=999').set('Authorization','Bearer token').expect(400);
  });
});

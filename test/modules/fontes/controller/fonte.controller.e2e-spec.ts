import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import FonteDomainException from '@/modules/fontes/exceptions/fonte_domain.exception';
import { CREATE_FONTE_SERVICE, LIST_FONTES_SERVICE } from '@/modules/fontes/symbols';
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

describe('Fontes API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: jest.Mocked<ITokenService>;
  let createFonte: { execute: jest.Mock };
  let listFontes: { execute: jest.Mock };

  const tenantId = '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc';
  const userId = '4c67eb4d-b04d-435d-9435-5f1a8d026cf8';

  const tokenFor = (role: UserRole = UserRole.ADMIN) => {
    tokenService.verifyAccess.mockResolvedValue({ sub: userId, type: 'access', role, tenantId } as AccessTokenPayload);
  };

  const fonte = (nome: string, codigo: string | null = null) =>
    FonteEntity.create({ nome, codigo, descricao: 'desc' } as any);

  beforeEach(async () => {
    tokenService = { signAccess: jest.fn(), signRefresh: jest.fn(), verifyAccess: jest.fn(), verifyRefresh: jest.fn() } as any;
    createFonte = { execute: jest.fn() };
    listFontes = { execute: jest.fn() };
    const tenantRequestContext: Pick<TenantRequestContextService, 'run'> = {
      run: jest.fn(<T>(user: AccessTokenPayload | undefined, cb: () => Promise<T>) => {
        if (!user || !user.tenantId) throw new TenantContextException();
        return cb();
      }),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_SERVICE).useValue(tokenService)
      .overrideProvider(CREATE_FONTE_SERVICE).useValue(createFonte)
      .overrideProvider(LIST_FONTES_SERVICE).useValue(listFontes)
      .overrideProvider(TenantRequestContextService).useValue(tenantRequestContext)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterEach(async () => { if (app) await app.close(); });

  it('creates fonte returns 201 with persisted record', async () => {
    tokenFor();
    const entity = fonte('Tesouro Municipal', 'F-001');
    createFonte.execute.mockResolvedValue(right(entity));
    const res = await request(app.getHttpServer()).post('/api/fontes').set('Authorization','Bearer token').send({ nome:' Tesouro Municipal ', codigo:'F-001', tipo:'TESOURO' }).expect(201);
    expect(res.body).toMatchObject({ nome:'Tesouro Municipal', codigo:'F-001', ativo:true });
    expect(createFonte.execute).toHaveBeenCalledWith(expect.objectContaining({ nome:'Tesouro Municipal' }));
  });

  it('rejects duplicate codigo 409 via service', async () => {
    tokenFor();
    createFonte.execute.mockResolvedValue(left({ code: ErrorCodeConstants.FONTE_DUPLICATE_CODE, statusCode: 409, message: ErrorCodeConstants.FONTE_DUPLICATE_CODE } as any));
    await request(app.getHttpServer()).post('/api/fontes').set('Authorization','Bearer token').send({ nome:'Outra', codigo:'F-001' }).expect(409);
  });

  it('rejects invalid nome 400 via DTO validation', async () => {
    tokenFor();
    const res = await request(app.getHttpServer()).post('/api/fontes').set('Authorization','Bearer token').send({ nome:'A' }).expect(400);
    expect(createFonte.execute).not.toHaveBeenCalled();
    expect(JSON.stringify(res.body)).toContain(ErrorCodeConstants.FONTE_INVALID_NAME);
  });

  it('rejects unknown fields via whitelist 400', async () => {
    tokenFor();
    await request(app.getHttpServer()).post('/api/fontes').set('Authorization','Bearer token').send({ nome:'Valida', codigo:'F-002', unknownField:'x' }).expect(400);
    expect(createFonte.execute).not.toHaveBeenCalled();
  });

  it('lists fontes paginated with data/meta ordered nome ASC', async () => {
    tokenFor();
    const page = new PageEntity([fonte('A Fonte'), fonte('Z Fonte')], new PageMetaEntity({ pageOptions: new PageOptionsEntity('ASC',1,10), itemCount:2 }));
    listFontes.execute.mockResolvedValue(right(page));
    const res = await request(app.getHttpServer()).get('/api/fontes?page=1&take=10&order=ASC').set('Authorization','Bearer token').expect(200);
    expect(res.body.data.map((x:any)=>x.nome)).toEqual(['A Fonte','Z Fonte']);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBeDefined();
  });

  it('uses safe defaults when pagination absent', async () => {
    tokenFor();
    const page = new PageEntity([fonte('A Fonte')], new PageMetaEntity({ pageOptions: new PageOptionsEntity('ASC',1,10), itemCount:1 }));
    listFontes.execute.mockResolvedValue(right(page));
    await request(app.getHttpServer()).get('/api/fontes').set('Authorization','Bearer token').expect(200);
    expect(listFontes.execute).toHaveBeenCalledWith(expect.objectContaining({ page:1, take:10 }));
  });

  it('rejects invalid pagination 400', async () => {
    tokenFor();
    await request(app.getHttpServer()).get('/api/fontes?page=0&take=999').set('Authorization','Bearer token').expect(400);
    expect(listFontes.execute).not.toHaveBeenCalled();
  });

  it('requires tenant context', async () => {
    tokenService.verifyAccess.mockResolvedValue({ sub:userId, type:'access', role:UserRole.ADMIN, tenantId: null } as any);
    await request(app.getHttpServer()).get('/api/fontes').set('Authorization','Bearer token').expect(401);
  });
});

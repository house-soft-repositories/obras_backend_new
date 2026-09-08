import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import CreateObraPrivadaService from '@/modules/obras-privadas/application/create_obra_privada.service';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import type IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import type TenantContext from '@/core/multitenancy/tenant_context';

const makePessoaRepo = (): jest.Mocked<IPessoaRepository> =>
  ({ findById: jest.fn(), findByDocumento: jest.fn(), save: jest.fn(), findAll: jest.fn() });

const makeObraRepo = (): jest.Mocked<IObraPrivadaRepository> =>
  ({ findLastCodigo: jest.fn(), save: jest.fn(), findById: jest.fn() });

const makeTC = () => ({ require: () => ({ schemaName: 'tenant_abc' }) }) as unknown as TenantContext;

describe('CreateObraPrivadaService', () => {
  const base = {
    tenantId: 't1',
    descricao: 'Construção Residencial',
    proprietarioPessoaId: 'pessoa-1',
    logradouro: 'Rua A',
    uf: 'PI',
  };

  it('creates private work with OBP code when proprietor exists', async () => {
    const pessoaRepo = makePessoaRepo();
    const pessoa = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'João' } as any);
    pessoaRepo.findById.mockResolvedValue(right(pessoa as any));
    const obraRepo = makeObraRepo();
    obraRepo.findLastCodigo.mockResolvedValue(right(null));
    obraRepo.save.mockImplementation((e) => Promise.resolve(right(e)));
    const svc = new CreateObraPrivadaService(obraRepo, pessoaRepo, makeTC());
    const result = await svc.execute(base);
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().codigo).toMatch(/^OBP-\d{4}-0001$/);
    expect(obraRepo.save).toHaveBeenCalledTimes(1);
  });

  it('returns 422 when proprietario pessoa not found', async () => {
    const pessoaRepo = makePessoaRepo();
    pessoaRepo.findById.mockResolvedValue(right(null));
    const obraRepo = makeObraRepo();
    const svc = new CreateObraPrivadaService(obraRepo, pessoaRepo, makeTC());
    const result = await svc.execute(base);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO);
    expect(result.value.statusCode).toBe(422);
    expect(obraRepo.save).not.toHaveBeenCalled();
  });

  it('propagates pessoa lookup failure', async () => {
    const pessoaRepo = makePessoaRepo();
    pessoaRepo.findById.mockResolvedValue(left({ code: ErrorCodeConstants.PESSOA_REPOSITORY_FAILED } as any));
    const obraRepo = makeObraRepo();
    const svc = new CreateObraPrivadaService(obraRepo, pessoaRepo, makeTC());
    const result = await svc.execute(base);
    expect(result.isLeft()).toBe(true);
    expect(obraRepo.save).not.toHaveBeenCalled();
  });

  it('retries on duplicate codigo collision', async () => {
    const pessoaRepo = makePessoaRepo();
    const pessoa = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'João' } as any);
    pessoaRepo.findById.mockResolvedValue(right(pessoa as any));
    const obraRepo = makeObraRepo();
    obraRepo.findLastCodigo.mockResolvedValue(right(null));
    obraRepo.save
      .mockResolvedValueOnce(left({ code: ErrorCodeConstants.OBRA_PRIVADA_DUPLICATE_CODIGO } as any))
      .mockResolvedValueOnce(right(ObraPrivadaEntity.create({ ...base, codigo: 'OBP-2026-0001' } as any) as any));
    const svc = new CreateObraPrivadaService(obraRepo, pessoaRepo, makeTC());
    const result = await svc.execute(base);
    expect(result.isRight()).toBe(true);
    expect(obraRepo.save).toHaveBeenCalledTimes(2);
  });

  it('returns domain failure for invalid descricao without persisting', async () => {
    const pessoaRepo = makePessoaRepo();
    const pessoa = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'João' } as any);
    pessoaRepo.findById.mockResolvedValue(right(pessoa as any));
    const obraRepo = makeObraRepo();
    obraRepo.findLastCodigo.mockResolvedValue(right(null));
    const svc = new CreateObraPrivadaService(obraRepo, pessoaRepo, makeTC());
    const result = await svc.execute({ ...base, descricao: '  ' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_INVALID_DESCRICAO);
  });
});

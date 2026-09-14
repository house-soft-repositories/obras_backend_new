import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import GuiasService from '@/modules/obras/application/guias.service';
import IGuiasRepository from '@/modules/obras/adapters/guias_repository.interface';
import { TitularidadeEntity } from '@/modules/obras/domain/entities/guias.entity';
import { SituacaoTitularidade } from '@/modules/obras/domain/enums/situacao_titularidade.enum';
import GuiaRepositoryException from '@/modules/obras/exceptions/guia_repository.exception';

describe('GuiasService', () => {
  const tenantContext = {
    require: jest.fn(() => ({ tenantId: 'tenant-1', schemaName: 'tenant_1' })),
  };
  const repository = (): jest.Mocked<IGuiasRepository> => ({
    listLocalizacoes: jest.fn(), saveLocalizacao: jest.fn(), deleteLocalizacao: jest.fn(),
    listOrcamentos: jest.fn(), saveOrcamento: jest.fn(), deleteOrcamento: jest.fn(),
    getTitularidade: jest.fn(), upsertTitularidade: jest.fn(),
    listLicencas: jest.fn(), findLicenca: jest.fn(), saveLicenca: jest.fn(), deleteLicenca: jest.fn(),
    listRecebimentos: jest.fn(), findRecebimento: jest.fn(), saveRecebimento: jest.fn(), deleteRecebimento: jest.fn(),
  });

  it('rejects an orçamento whose fonte is absent from the tenant schema', async () => {
    const repo = repository();
    const dataSource = { query: jest.fn().mockResolvedValue([]) };
    const service = new GuiasService(repo, dataSource as never, tenantContext as never);

    const result = await service.createOrcamento({ obraId: 'obra-1', fonteId: 'fonte-1', valor: '1500.00' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.FONTE_NOT_FOUND);
    expect(repo.saveOrcamento).not.toHaveBeenCalled();
  });

  it('creates titularidade when none exists', async () => {
    const repo = repository();
    repo.getTitularidade.mockResolvedValue(right(null));
    repo.upsertTitularidade.mockImplementation(async (entity) => right(entity));
    const service = new GuiasService(repo, { query: jest.fn() } as never, tenantContext as never);

    const result = await service.upsertTitularidade({ obraId: 'obra-1', situacao: SituacaoTitularidade.EXISTENTE, tipo: 'PROPRIA' });

    expect(result.isRight()).toBe(true);
    expect(repo.upsertTitularidade).toHaveBeenCalledWith(expect.any(TitularidadeEntity));
  });

  it('updates existing titularidade', async () => {
    const repo = repository();
    const existing = TitularidadeEntity.create({ tenantId: 'tenant-1', obraId: 'obra-1', situacao: SituacaoTitularidade.EXISTENTE });
    repo.getTitularidade.mockResolvedValue(right(existing));
    repo.upsertTitularidade.mockImplementation(async (entity) => right(entity));
    const service = new GuiasService(repo, { query: jest.fn() } as never, tenantContext as never);

    const result = await service.upsertTitularidade({ obraId: 'obra-1', situacao: SituacaoTitularidade.NAO_EXISTENTE, observacoes: 'Regularizar' });

    expect(result.isRight()).toBe(true);
    expect(existing.toObject()).toMatchObject({ situacao: SituacaoTitularidade.NAO_EXISTENTE, observacoes: 'Regularizar' });
  });

  it('returns 404 when updating a missing recebimento', async () => {
    const repo = repository();
    repo.findRecebimento.mockResolvedValue(right(null));
    const service = new GuiasService(repo, { query: jest.fn() } as never, tenantContext as never);

    const result = await service.updateRecebimento({ id: 'recebimento-1', data: '2026-09-14' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.code).toBe(ErrorCodeConstants.RECEBIMENTO_NOT_FOUND);
  });

  it('propagates titularidade repository errors', async () => {
    const repo = repository();
    repo.getTitularidade.mockResolvedValue(left(new GuiaRepositoryException({ code: ErrorCodeConstants.GUIA_REPOSITORY_FAILED, statusCode: 500 })));
    const service = new GuiasService(repo, { query: jest.fn() } as never, tenantContext as never);

    const result = await service.upsertTitularidade({ obraId: 'obra-1', situacao: SituacaoTitularidade.EXISTENTE });

    expect(result.isLeft()).toBe(true);
  });
});

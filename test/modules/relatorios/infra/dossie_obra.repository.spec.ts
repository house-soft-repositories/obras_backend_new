import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { DataSource } from 'typeorm';
import { AditivoFonteModel, AditivoModel } from '@/modules/contratos/infra/models/aditivo.model';
import {
  ContratoFonteModel,
  ContratoModel,
} from '@/modules/contratos/infra/models/contrato.model';
import { ParalisacaoModel } from '@/modules/contratos/infra/models/paralisacao.model';
import ArquivoModel from '@/modules/documentos/infra/models/arquivo.model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { ObraResponsavelModel } from '@/modules/obras/infra/models/obra_items.model';
import DossieObraRepository from '@/modules/relatorios/infra/repositories/dossie_obra.repository';
import type {
  EstagioDetalheRelatorio,
  MedicaoDetalheRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

const OBRA_ID = 'obra-1';

function obraModel(): ObraModel {
  return {
    id: OBRA_ID,
    codigo: 'OB-001',
    nome: 'Escola Modelo',
    descricao: 'Construção',
    tipo: 'OBRA',
    status: 'EM_DESENVOLVIMENTO',
    tipoFinanciamento: 'SEM_OGU',
    acaoConveniada: 'NAO',
    prioritaria: true,
    dataInicio: '2024-01-10',
    dataPrazo: '2026-06-30',
    dataPactuada: null,
    orgao: { nome: 'Secretaria de Obras' },
    localidade: { nome: 'Cidade', uf: 'UF' },
    secretario: null,
    programaPpa: null,
    acaoEstrategica: null,
    unidadeMedida: 'un',
    quantidade: '1',
  } as unknown as ObraModel;
}

function setup(
  repos: Map<new (...args: never[]) => unknown, unknown>,
  detalhe: {
    obra: unknown;
    estagios: EstagioDetalheRelatorio[];
    medicoes: MedicaoDetalheRelatorio[];
  } = {
    obra: { nome: 'Escola', status: 'EM_DESENVOLVIMENTO', descricao: null },
    estagios: [],
    medicoes: [],
  },
) {
  const getRepository = jest.fn((model: unknown) => {
    const repo = repos.get(model as new (...args: never[]) => unknown);
    if (!repo) throw new Error('sem mock de repository');
    return repo;
  });
  const runner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    query: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    isTransactionActive: true,
    manager: { getRepository },
  };
  const ds = {
    createQueryRunner: jest.fn(() => runner),
  } as unknown as DataSource;
  const tc = {
    require: () => ({ schemaName: 'tenant_t', tenantId: 'tenant-1' }),
  } as unknown as TenantContext;
  const query = {
    carregarDetalheObra: jest.fn().mockResolvedValue(detalhe),
  } as unknown as jest.Mocked<RelatoriosQuery>;
  return {
    runner,
    query,
    repository: new DossieObraRepository(ds, tc, query),
  };
}

function repoMock(findResult: unknown = [], findOneResult: unknown = null) {
  return { find: jest.fn().mockResolvedValue(findResult), findOne: jest.fn().mockResolvedValue(findOneResult) };
}

describe('DossieObraRepository', () => {
  it('retorna null quando a obra não existe', async () => {
    const repos = new Map([
      [ObraModel, repoMock([], null)],
      [ObraResponsavelModel, repoMock([])],
      [ContratoModel, repoMock([])],
      [ArquivoModel, repoMock([])],
    ]);
    const { repository } = setup(repos);

    const result = await repository.carregar('inexistente');

    expect(result.isRight()).toBe(true);
    if (result.isRight()) expect(result.value).toBeNull();
  });

  it('carrega ficha, equipe, contrato, aditivos, paralisações e fotos via models', async () => {
    const responsaveis = [
      { tipo: 'RESPONSAVEL', usuario: { name: 'Ana' } },
      { tipo: 'FISCAL', usuario: { name: 'Beto' } },
    ] as unknown as ObraResponsavelModel[];
    const contrato = {
      id: 'contrato-1',
      numero: 'CT-10',
      objeto: 'Execução',
      empresaContratada: { razaoSocial: 'Construtora X', cnpj: '12345678000190' },
      dataAssinatura: '2024-02-01',
      dataOs: '2024-02-10',
      fimVigencia: null,
      tipoPrazoExecucao: 'DIAS',
      prazoExecucaoDias: 365,
      prazoExecucaoData: null,
    } as unknown as ContratoModel;
    const repos = new Map([
      [ObraModel, repoMock([], obraModel())],
      [ObraResponsavelModel, repoMock(responsaveis)],
      [ContratoModel, repoMock([contrato])],
      [ContratoFonteModel, repoMock([{ valor: '60000.00' }, { valor: '40000.00' }])],
      [AditivoModel, repoMock([{ id: 'ad-1', numero: 'AD-01', tipo: 'VALOR', dataAssinatura: '2025-01-15', vigenciaAditivada: null, prazoExecucaoDias: null }])],
      [AditivoFonteModel, repoMock([{ aditivoId: 'ad-1', valor: '10000.00' }])],
      [ParalisacaoModel, repoMock([{ dataParalisacao: '2025-03-01', motivo: 'Chuvas', dataReinicio: null, diasParados: null }])],
      [
        ArquivoModel,
        repoMock([
          { id: 'f1', storageKey: 'k/f1.jpg', mimeType: 'image/jpeg', nome: 'f1.jpg', descricao: null, createdAt: new Date('2026-09-01T10:00:00.000Z') },
        ]),
      ],
    ]);
    const { repository, runner } = setup(repos, {
      obra: { nome: 'Escola', status: 'EM_DESENVOLVIMENTO', descricao: null },
      estagios: [{ nome: 'Fundação', percentual_direto: '100', data_fim: '2024-06-30', status: 'CONCLUIDO' }],
      medicoes: [{ numero: 1, data: '2024-07-05', tipo: 'PARCIAL', valor: '50000' }],
    });

    const result = await repository.carregar(OBRA_ID);

    expect(result.isRight()).toBe(true);
    if (result.isRight() && result.value) {
      expect(result.value.dossie.obra.codigo).toBe('OB-001');
      expect(result.value.dossie.obra.localidadeNome).toBe('Cidade/UF');
      expect(result.value.dossie.obra.orgaoNome).toBe('Secretaria de Obras');
      expect(result.value.dossie.equipe).toEqual([
        { nome: 'Beto', tipo: 'FISCAL' },
        { nome: 'Ana', tipo: 'RESPONSAVEL' },
      ]);
      expect(result.value.dossie.contrato?.valorInicial).toBe('100000.00');
      expect(result.value.dossie.contrato?.empresaCnpj).toBe('12345678000190');
      expect(result.value.dossie.aditivos).toEqual([
        expect.objectContaining({ numero: 'AD-01', valor: '10000.00' }),
      ]);
      expect(result.value.dossie.paralisacoes).toEqual([
        expect.objectContaining({ motivo: 'Chuvas' }),
      ]);
      expect(result.value.dossie.estagios[0]).toEqual(
        expect.objectContaining({ descricao: 'Fundação', concluido: true }),
      );
      expect(result.value.dossie.medicoes[0]).toEqual(
        expect.objectContaining({ numero: 1, valor: '50000.00' }),
      );
      expect(result.value.fotos).toEqual([
        expect.objectContaining({ id: 'f1', legenda: 'f1.jpg', data: '2026-09-01' }),
      ]);
    }
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('filtra fotos por obra e traz relações de obra, responsável e contrato', async () => {
    const obraRepo = repoMock([], obraModel());
    const responsavelRepo = repoMock([]);
    const contratoRepo = repoMock([]);
    const arquivoRepo = repoMock([]);
    const repos = new Map([
      [ObraModel, obraRepo],
      [ObraResponsavelModel, responsavelRepo],
      [ContratoModel, contratoRepo],
      [ArquivoModel, arquivoRepo],
    ]);
    const { repository } = setup(repos);

    await repository.carregar(OBRA_ID);

    const findOneArg = (obraRepo.findOne.mock.calls as unknown[][])[0][0] as {
      where: { id: string };
      relations: { orgao: boolean; localidade: boolean };
    };
    expect(findOneArg.where.id).toBe(OBRA_ID);
    expect(findOneArg.relations).toEqual({ orgao: true, localidade: true });

    const responsavelArg = (responsavelRepo.find.mock.calls as unknown[][])[0][0] as {
      where: { obraId: string };
      relations: { usuario: boolean };
    };
    expect(responsavelArg.where.obraId).toBe(OBRA_ID);
    expect(responsavelArg.relations).toEqual({ usuario: true });

    const contratoArg = (contratoRepo.find.mock.calls as unknown[][])[0][0] as {
      where: { obraId: string };
      relations: { empresaContratada: boolean };
    };
    expect(contratoArg.where.obraId).toBe(OBRA_ID);
    expect(contratoArg.relations).toEqual({ empresaContratada: true });

    const arquivoArg = (arquivoRepo.find.mock.calls as unknown[][])[0][0] as {
      where: { obraId: string };
    };
    expect(arquivoArg.where.obraId).toBe(OBRA_ID);
  });

  it('retorna contrato nulo e listas vazias quando a obra não tem contrato', async () => {
    const repos = new Map([
      [ObraModel, repoMock([], obraModel())],
      [ObraResponsavelModel, repoMock([])],
      [ContratoModel, repoMock([])],
      [ArquivoModel, repoMock([])],
    ]);
    const { repository } = setup(repos);

    const result = await repository.carregar(OBRA_ID);

    expect(result.isRight()).toBe(true);
    if (result.isRight() && result.value) {
      expect(result.value.dossie.contrato).toBeNull();
      expect(result.value.dossie.aditivos).toEqual([]);
      expect(result.value.dossie.paralisacoes).toEqual([]);
    }
  });

  it('retorna left com RELATORIO_REPOSITORY_FAILED em erro do manager', async () => {
    const getRepository = jest.fn(() => {
      throw new Error('falha banco');
    });
    const runner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      query: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      isTransactionActive: true,
      manager: { getRepository },
    };
    const ds = { createQueryRunner: jest.fn(() => runner) } as unknown as DataSource;
    const tc = {
      require: () => ({ schemaName: 'tenant_t', tenantId: 'tenant-1' }),
    } as unknown as TenantContext;
    const query = {
      carregarDetalheObra: jest.fn().mockResolvedValue({
        obra: { nome: 'Escola', status: 'EM_DESENVOLVIMENTO', descricao: null },
        estagios: [],
        medicoes: [],
      }),
    } as unknown as jest.Mocked<RelatoriosQuery>;
    const repository = new DossieObraRepository(ds, tc, query);

    const result = await repository.carregar(OBRA_ID);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED);
    }
    expect(runner.rollbackTransaction).toHaveBeenCalled();
  });
});

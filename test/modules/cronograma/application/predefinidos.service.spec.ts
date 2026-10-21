import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import PredefinidosService from '@/modules/cronograma/application/predefinidos.service';
import type IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';
import { ModoDuracao } from '@/modules/cronograma/domain/enums/cronograma.enums';

describe('PredefinidosService', () => {
  const createMocks = () => {
    const repo = {
      saveMany: jest.fn(),
      listRootEstagios: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;

    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;

    return { repo, obras };
  };

  it('returns template for obra tipo financiamento', async () => {
    const { repo, obras } = createMocks();
    obras.findById.mockResolvedValue(
      right({ tipoFinanciamento: TipoFinanciamento.SEM_OGU } as never),
    );
    const service = new PredefinidosService(repo, new TenantContext(), obras);

    const result = await service.getTemplate({ obraId: 'obra' });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual([
      { nome: 'EM LICITACAO', posicao: 0, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'CONTRATADA', posicao: 1, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'ORDEM DE SERVICO', posicao: 2, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'EM EXECUCAO', posicao: 3, modoDuracao: ModoDuracao.DIAS_CORRIDOS },
      { nome: 'CONCLUIDA', posicao: 4, modoDuracao: ModoDuracao.NAO_INFORMADO },
    ]);
  });

  it('returns template for COM_OGU when specified', async () => {
    const { repo, obras } = createMocks();
    obras.findById.mockResolvedValue(
      right({ tipoFinanciamento: TipoFinanciamento.SEM_OGU } as never),
    );
    const service = new PredefinidosService(repo, new TenantContext(), obras);

    const result = await service.getTemplate({
      obraId: 'obra',
      tipoFinanciamento: TipoFinanciamento.COM_OGU,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual([
      { nome: 'EM LICITACAO', posicao: 0, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'CONTRATADA', posicao: 1, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'ORDEM DE SERVICO', posicao: 2, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'EM EXECUCAO', posicao: 3, modoDuracao: ModoDuracao.DIAS_CORRIDOS },
      { nome: 'MEDICAO', posicao: 4, modoDuracao: ModoDuracao.DIAS_CORRIDOS },
      { nome: 'PRESTACAO DE CONTAS', posicao: 5, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'CONCLUIDA', posicao: 6, modoDuracao: ModoDuracao.NAO_INFORMADO },
    ]);
  });

  it('returns template for INVESTIMENTO_PRIVADO when specified', async () => {
    const { repo, obras } = createMocks();
    obras.findById.mockResolvedValue(
      right({ tipoFinanciamento: TipoFinanciamento.SEM_OGU } as never),
    );
    const service = new PredefinidosService(repo, new TenantContext(), obras);

    const result = await service.getTemplate({
      obraId: 'obra',
      tipoFinanciamento: TipoFinanciamento.INVESTIMENTO_PRIVADO,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual([
      { nome: 'PROJETO', posicao: 0, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'LICENCIAMENTO', posicao: 1, modoDuracao: ModoDuracao.NAO_INFORMADO },
      { nome: 'EM EXECUCAO', posicao: 2, modoDuracao: ModoDuracao.DIAS_CORRIDOS },
      { nome: 'CONCLUIDA', posicao: 3, modoDuracao: ModoDuracao.NAO_INFORMADO },
    ]);
  });

  it('creates predefined stages through one atomic repository call', async () => {
    const { repo, obras } = createMocks();
    obras.findById.mockResolvedValue(
      right({ tipoFinanciamento: TipoFinanciamento.SEM_OGU } as never),
    );
    repo.listRootEstagios.mockResolvedValue(right([]));
    repo.saveMany.mockImplementation(async (items) => right(items));
    const tenantContext = new TenantContext();
    const service = new PredefinidosService(repo, tenantContext, obras);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.create({
          obraId: 'obra',
          autorUsuarioId: 'user',
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(repo.saveMany).toHaveBeenCalledTimes(1);
    expect(repo.saveMany.mock.calls[0][0].map((item) => item.nome)).toEqual([
      'EM LICITACAO',
      'CONTRATADA',
      'ORDEM DE SERVICO',
      'EM EXECUCAO',
      'CONCLUIDA',
    ]);
  });

  it('returns empty array when obra has no matching template', async () => {
    const { repo, obras } = createMocks();
    // Using a tipoFinanciamento that doesn't have a template
    obras.findById.mockResolvedValue(
      right({ tipoFinanciamento: 'UNKNOWN' as never } as never),
    );
    const service = new PredefinidosService(repo, new TenantContext(), obras);

    const result = await service.create({
      obraId: 'obra',
      autorUsuarioId: 'user',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual([]);
  });

  it('returns cronograma not found when obra does not exist', async () => {
    const { repo, obras } = createMocks();
    obras.findById.mockResolvedValue(right(null));
    const service = new PredefinidosService(repo, new TenantContext(), obras);

    const result = await service.getTemplate({ obraId: 'obra-inexistente' });

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('propagates unexpected obra repository failures', async () => {
    const { repo, obras } = createMocks();
    const failure = new ObraRepositoryException({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      statusCode: 500,
    });
    obras.findById.mockResolvedValue(left(failure));
    const service = new PredefinidosService(repo, new TenantContext(), obras);

    const result = await service.getTemplate({ obraId: 'obra' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
  });

  it('calculates correct position based on existing root estagios', async () => {
    const { repo, obras } = createMocks();
    const existingStage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Existing',
      posicao: 5,
    });
    obras.findById.mockResolvedValue(
      right({ tipoFinanciamento: TipoFinanciamento.SEM_OGU } as never),
    );
    repo.listRootEstagios.mockResolvedValue(right([existingStage]));
    repo.saveMany.mockImplementation(async (items) => right(items));
    const tenantContext = new TenantContext();
    const service = new PredefinidosService(repo, tenantContext, obras);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.create({
          obraId: 'obra',
          autorUsuarioId: 'user',
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value[0].posicao).toBe(6);
  });
});
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import UpdateMedicaoService from '@/modules/cronograma/application/update_medicao.service';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

describe('UpdateMedicaoService', () => {
  const tenant = {
    tenantId: 'tenant',
    schemaName: 'tenant_00000000000000000000000000000000',
  };

  const makeDataSource = () =>
    ({
      createQueryRunner: () => ({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        query: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        isTransactionActive: true,
        isReleased: false,
        manager: {
          getRepository: () => ({ findOne: jest.fn() }),
        },
      }),
    }) as never;

  function makeFonte(ativo = true) {
    return FonteEntity.create({
      nome: 'Fonte',
      descricao: null,
      codigo: null,
      tipo: null,
      valorPrevisto: null,
      vigencia: null,
      ativo,
    });
  }

  function makeMedicao() {
    return MedicaoEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      orgaoId: 'orgao',
      numero: 1,
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-10-05',
      itens: [{ fonteId: 'fonte', valor: 100 }],
    });
  }

  function setup() {
    const repository = {
      findById: jest.fn(),
      update: jest.fn(),
      getSaldoMedicao: jest.fn(),
      existsNormalNumero: jest.fn(),
    } as unknown as jest.Mocked<IMedicaoRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const fontes = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IFonteRepository>;
    const tenantContext = new TenantContext();
    const service = new UpdateMedicaoService(
      repository,
      tenantContext,
      obras,
      fontes,
      makeDataSource(),
    );

    obras.findById.mockResolvedValue(right({} as never));
    fontes.findById.mockResolvedValue(right(makeFonte()));
    repository.existsNormalNumero.mockResolvedValue(right(false));
    repository.getSaldoMedicao.mockResolvedValue(
      right({ orcamentoTotal: '1000', medicoesAcumuladas: '0' }),
    );

    return { repository, obras, fontes, tenantContext, service };
  }

  it('blocks duplicate NORMAL number on update', async () => {
    const { repository, tenantContext, service } = setup();
    const medicao = makeMedicao();
    repository.findById.mockResolvedValue(right(medicao));
    repository.existsNormalNumero.mockResolvedValue(right(true));

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        id: medicao.id,
        numero: 2,
      }),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT);
    expect(result.value.statusCode).toBe(409);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('accepts update when replacement value fits remaining budget', async () => {
    const { repository, tenantContext, service } = setup();
    const medicao = makeMedicao();
    repository.findById.mockResolvedValue(right(medicao));
    repository.update.mockImplementation((updatedMedicao) =>
      Promise.resolve(right(updatedMedicao)),
    );
    repository.getSaldoMedicao.mockResolvedValue(
      right({ orcamentoTotal: '200', medicoesAcumuladas: '100' }),
    );

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        id: medicao.id,
        fontes: [{ fonteId: 'fonte', valor: 100 }],
      }),
    );

    expect(result.isRight()).toBe(true);
    expect(repository.update).toHaveBeenCalled();
  });

  it('rejects update when replacement exceeds remaining budget', async () => {
    const { repository, tenantContext, service } = setup();
    const medicao = makeMedicao();
    repository.findById.mockResolvedValue(right(medicao));
    repository.getSaldoMedicao.mockResolvedValue(
      right({ orcamentoTotal: '150', medicoesAcumuladas: '100' }),
    );

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        id: medicao.id,
        fontes: [{ fonteId: 'fonte', valor: 51 }],
      }),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(
      ErrorCodeConstants.MEDICAO_ORCAMENTO_EXCEDIDO,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects inactive fonte before saving', async () => {
    const { repository, fontes, tenantContext, service } = setup();
    const medicao = makeMedicao();
    repository.findById.mockResolvedValue(right(medicao));
    fontes.findById.mockResolvedValue(right(makeFonte(false)));

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        id: medicao.id,
        fontes: [{ fonteId: 'fonte', valor: 100 }],
      }),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.MEDICAO_FONTE_INVALIDA);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

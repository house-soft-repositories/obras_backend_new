import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import CreateMedicaoService from '@/modules/cronograma/application/create_medicao.service';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

describe('CreateMedicaoService', () => {
  const tenant = {
    tenantId: 'tenant',
    schemaName: 'tenant_00000000000000000000000000000000',
  };

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

  function setup() {
    const repository = {
      save: jest.fn(),
      existsNormalNumero: jest.fn(),
    } as unknown as jest.Mocked<IMedicaoRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const fontes = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IFonteRepository>;
    const tenantContext = new TenantContext();
    const service = new CreateMedicaoService(
      repository,
      tenantContext,
      obras,
      fontes,
    );

    obras.findById.mockResolvedValue(right({} as never));
    fontes.findById.mockResolvedValue(right(makeFonte()));
    repository.existsNormalNumero.mockResolvedValue(right(false));

    return { repository, obras, fontes, tenantContext, service };
  }

  it('creates a medicao with active fontes and informed numero', async () => {
    const { repository, tenantContext, service } = setup();
    repository.save.mockImplementation((medicao) =>
      Promise.resolve(right(medicao)),
    );

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        orgaoId: 'orgao',
        numero: 7,
        tipo: TipoMedicao.NORMAL,
        dataMedicao: '2026-10-05',
        fontes: [{ fonteId: 'fonte', valor: 100 }],
      }),
    );

    expect(result.isRight()).toBe(true);
    expect(repository.existsNormalNumero).toHaveBeenCalledWith('obra', 7);
    expect(repository.save.mock.calls[0][0]).toBeInstanceOf(MedicaoEntity);
    expect(repository.save.mock.calls[0][0].numero).toBe(7);
    expect(repository.save.mock.calls[0][0].orgaoId).toBe('orgao');
  });

  it('blocks duplicate NORMAL number on create', async () => {
    const { repository, tenantContext, service } = setup();
    repository.existsNormalNumero.mockResolvedValue(right(true));

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        orgaoId: 'orgao',
        numero: 7,
        tipo: TipoMedicao.NORMAL,
        dataMedicao: '2026-10-05',
        fontes: [{ fonteId: 'fonte', valor: 100 }],
      }),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT);
    expect(result.value.statusCode).toBe(409);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects inactive fonte before saving', async () => {
    const { repository, fontes, tenantContext, service } = setup();
    fontes.findById.mockResolvedValue(right(makeFonte(false)));

    const result = await tenantContext.run(tenant, () =>
      service.execute({
        obraId: 'obra',
        orgaoId: 'orgao',
        numero: 2,
        tipo: TipoMedicao.EXTRA,
        dataMedicao: '2026-10-05',
        fontes: [{ fonteId: 'fonte', valor: 100 }],
      }),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.MEDICAO_FONTE_INVALIDA);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
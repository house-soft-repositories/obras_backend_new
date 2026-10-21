import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import GetMedicaoService from '@/modules/cronograma/application/get_medicao.service';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

describe('GetMedicaoService', () => {
  const tenant = {
    tenantId: 'tenant',
    schemaName: 'tenant_00000000000000000000000000000000',
  };

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
    } as unknown as jest.Mocked<IMedicaoRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const service = new GetMedicaoService(repository, obras);

    obras.findById.mockResolvedValue(right({} as never));

    return { repository, obras, service };
  }

  it('details medicao scoped by obra', async () => {
    const { repository, service } = setup();
    const medicao = makeMedicao();
    repository.findById.mockResolvedValue(right(medicao));

    const result = await service.execute({ obraId: 'obra', id: medicao.id });

    expect(result.isRight()).toBe(true);
    expect(repository.findById).toHaveBeenCalledWith('obra', medicao.id);
  });

  it('returns error when medicao is not found', async () => {
    const { repository, service } = setup();
    const failure = new CronogramaRepositoryException({
      code: 'CRONOGRAMA_NOT_FOUND',
      statusCode: 404,
    });
    repository.findById.mockResolvedValue(left(failure));

    const result = await service.execute({ obraId: 'obra', id: 'medicao' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
  });
});
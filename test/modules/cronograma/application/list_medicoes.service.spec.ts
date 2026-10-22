import TenantContext from '@/core/multitenancy/tenant_context';
import { left, right } from '@/core/types/either';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import ListMedicoesService from '@/modules/cronograma/application/list_medicoes.service';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';

describe('ListMedicoesService', () => {
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
      list: jest.fn(),
    } as unknown as jest.Mocked<IMedicaoRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const service = new ListMedicoesService(repository, obras);

    obras.findById.mockResolvedValue(right({} as never));

    return { repository, obras, service };
  }

  it('lists medicoes scoped by obra', async () => {
    const { repository, service } = setup();
    const medicao = makeMedicao();
    const pageOptions = new PageOptionsEntity('ASC', 1, 10);
    const page = new PageEntity([medicao], 1, pageOptions);
    repository.list.mockResolvedValue(right(page));

    const result = await service.execute({
      obraId: 'obra',
      options: pageOptions,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value.pageData).toHaveLength(1);
    expect(repository.list).toHaveBeenCalledWith('obra', pageOptions);
  });
});

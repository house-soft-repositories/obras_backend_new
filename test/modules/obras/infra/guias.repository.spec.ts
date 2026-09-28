import { right } from '@/core/types/either';
import GuiasRepository from '@/modules/obras/infra/repositories/guias.repository';
import type TenantContext from '@/core/multitenancy/tenant_context';
import type { DataSource } from 'typeorm';

describe('GuiasRepository', () => {
  const tenantContext = {
    require: jest.fn(() => ({ tenantId: 'tenant-1', schemaName: 'tenant_1' })),
  } as unknown as TenantContext;

  it('returns orçamento read model with fonte data', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'obra-1' }])
        .mockResolvedValueOnce([
          {
            orcamentoId: 'orcamento-1',
            obraId: 'obra-1',
            fonteId: 'fonte-1',
            fonteNome: 'Tesouro',
            fonteDescricao: 'Recursos próprios',
            valor: '1000.00',
          },
        ]),
    } as unknown as DataSource;
    const repository = new GuiasRepository(dataSource, tenantContext);

    const result = await repository.listOrcamentos('obra-1');

    expect(result).toEqual(
      right([
        {
          orcamentoId: 'orcamento-1',
          obraId: 'obra-1',
          fonte: {
            fonteId: 'fonte-1',
            fonteNome: 'Tesouro',
            fonteDescricao: 'Recursos próprios',
            valor: '1000.00',
          },
        },
      ]),
    );
    expect(dataSource.query).toHaveBeenLastCalledWith(
      expect.stringContaining('INNER JOIN "tenant_1"."fontes"'),
      ['obra-1'],
    );
  });
});

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import { TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';
import ContratoDomainException from '@/modules/contratos/exceptions/contrato_domain.exception';

describe('ContratoEntity', () => {
  const base = {
    tenantId: 'tenant-1',
    obraId: 'obra-1',
    empresaContratadaId: 'empresa-1',
    numero: ' CTR-001 ',
    dataOs: '2026-09-14',
    tipoPrazoExecucao: TipoPrazoExecucao.DIAS,
    prazoExecucaoDias: 30,
    fontes: [{ fonteId: 'fonte-1', valor: '1000.00' }],
  };

  it('creates a contrato with normalized number and fontes', () => {
    const contrato = ContratoEntity.create(base);

    expect(contrato.id).toEqual(expect.any(String));
    expect(contrato.numero).toBe('CTR-001');
    expect(contrato.fontes).toEqual([
      { fonteId: 'fonte-1', valor: '1000.00' },
    ]);
  });

  it.each([
    [{ ...base, numero: ' ' }],
    [{ ...base, fontes: [] }],
    [{ ...base, fontes: [{ fonteId: 'fonte-1', valor: '0' }] }],
    [{ ...base, prazoExecucaoDias: 0 }],
    [{ ...base, tipoPrazoExecucao: TipoPrazoExecucao.DATA, prazoExecucaoDias: null, prazoExecucaoData: null }],
  ])('rejects invalid contract input', (props) => {
    expect.assertions(2);

    try {
      ContratoEntity.create(props);
    } catch (error) {
      expect(error).toBeInstanceOf(ContratoDomainException);
      expect((error as ContratoDomainException).code).toBe(
        ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      );
    }
  });
});

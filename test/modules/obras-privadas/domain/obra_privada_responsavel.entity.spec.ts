import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

const baseProps = {
  tenantId: 'tenant-id',
  obraPrivadaId: 'obra-id',
  profissionalTecnicoId: 'profissional-id',
  papel: PapelResponsavelTecnico.EXECUCAO,
  tipoDocumento: TipoDocumentoResponsabilidade.ART,
  numeroDocumento: ' ART-123 ',
  dataDocumento: null,
  arquivoId: null,
  dataInicio: '2026-01-01',
  dataBaixa: null,
  motivoBaixa: null,
};

describe('ObraPrivadaResponsavelEntity', () => {
  it('creates a responsibility and normalizes document fields', () => {
    const entity = ObraPrivadaResponsavelEntity.create(baseProps);

    expect(entity.toObject()).toEqual(
      expect.objectContaining({
        numeroDocumento: 'ART-123',
        motivoBaixa: null,
      }),
    );
  });

  it('requires a reason when the responsibility has a baixa date', () => {
    expect(() =>
      ObraPrivadaResponsavelEntity.create({
        ...baseProps,
        dataBaixa: '2026-02-01',
      }),
    ).toThrow(ObraPrivadaDomainException);
  });

  it('accepts a baixa date with a non-empty reason', () => {
    const entity = ObraPrivadaResponsavelEntity.create({
      ...baseProps,
      dataBaixa: '2026-02-01',
      motivoBaixa: ' Encerramento do vínculo ',
    });

    expect(entity.toObject().motivoBaixa).toBe('Encerramento do vínculo');
  });

  it('rejects invalid responsibility enums', () => {
    expect(() =>
      ObraPrivadaResponsavelEntity.create({
        ...baseProps,
        papel: 'INVALIDO' as PapelResponsavelTecnico,
      }),
    ).toThrow(ObraPrivadaDomainException);
  });
});

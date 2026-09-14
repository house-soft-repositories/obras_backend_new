import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { EixoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import {
  LicencaEntity,
  ObraLocalizacaoEntity,
  RecebimentoEntity,
} from '@/modules/obras/domain/entities/guias.entity';
import { SituacaoLicenca } from '@/modules/obras/domain/enums/situacao_licenca.enum';
import { TipoRecebimento } from '@/modules/obras/domain/enums/tipo_recebimento.enum';
import CadastroDomainException from '@/modules/obras/exceptions/cadastro_domain.exception';
import GuiaDomainException from '@/modules/obras/exceptions/guia_domain.exception';

describe('cadastros e guias entities', () => {
  it('creates and updates an eixo', () => {
    const eixo = EixoEntity.create({ tenantId: 'tenant-1', nome: ' Mobilidade ' });
    eixo.update({ nome: 'Infraestrutura', ativo: false });

    expect(eixo.toObject()).toMatchObject({
      nome: 'Infraestrutura',
      ativo: false,
    });
  });

  it('rejects a cadastro with a short name', () => {
    expect.assertions(2);

    try {
      EixoEntity.create({ tenantId: 'tenant-1', nome: 'A' });
    } catch (error) {
      expect(error).toBeInstanceOf(CadastroDomainException);
      expect((error as CadastroDomainException).code).toBe(
        ErrorCodeConstants.CADASTRO_INVALID_NOME,
      );
    }
  });

  it('validates guia enums and normalizes locality data', () => {
    const localizacao = ObraLocalizacaoEntity.create({
      tenantId: 'tenant-1',
      obraId: 'obra-1',
      localidade: ' Centro ',
      uf: ' ce ',
    });
    const licenca = LicencaEntity.create({
      tenantId: 'tenant-1',
      obraId: 'obra-1',
      situacao: SituacaoLicenca.EXISTENTE,
    });
    const recebimento = RecebimentoEntity.create({
      tenantId: 'tenant-1',
      obraId: 'obra-1',
      tipo: TipoRecebimento.PROVISORIO,
    });

    expect(localizacao.toObject()).toMatchObject({
      localidade: 'Centro',
      uf: 'CE',
    });
    expect(licenca.situacao).toBe(SituacaoLicenca.EXISTENTE);
    expect(recebimento.tipo).toBe(TipoRecebimento.PROVISORIO);
  });

  it('rejects an invalid license state', () => {
    expect.assertions(2);

    try {
      LicencaEntity.create({
        tenantId: 'tenant-1',
        obraId: 'obra-1',
        situacao: 'INVALIDA' as SituacaoLicenca,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(GuiaDomainException);
      expect((error as GuiaDomainException).code).toBe(
        ErrorCodeConstants.GUIA_INVALID_ENUM,
      );
    }
  });
});

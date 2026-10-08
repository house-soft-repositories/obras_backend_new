import ErrorCodeConstants from '@/core/constants/error_code.constants';
import type { AlvaraProps } from '@/modules/obras-privadas/domain/entities/alvara.entity';
import type { AutoInfracaoProps } from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import DossieObraPrivadaEntity, {
  type MontarDossieObraPrivadaParam,
} from '@/modules/obras-privadas/domain/entities/dossie_obra_privada.entity';
import type { FiscalizacaoProps } from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import type { HabiteSeProps } from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import type { ObraPrivadaProps } from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import {
  MotivoAlvara,
  ResultadoFiscalizacao,
  ResultadoHabiteSe,
  SituacaoAutoInfracao,
  SituacaoRegistroAlvara,
  TipoAlvara,
  TipoAutoInfracao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type { PessoaProps } from '@/modules/pessoas/domain/entities/pessoa.entity';
import type { ResponsavelDetalhe } from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';

function obraBase(): ObraPrivadaProps {
  return {
    id: 'obra-1',
    tenantId: 'tenant-1',
    codigo: 'OBP-2026-0001',
    descricao: 'Casa',
    logradouro: 'Rua A',
    numero: '10',
    bairro: 'Centro',
    uf: 'PI',
    inscricaoImobiliaria: null,
    matriculaRgi: null,
    latitude: null,
    longitude: null,
    situacaoAlvara: 'COM_ALVARA_VIGENTE',
    andamento: 'EM_ANDAMENTO',
    habiteSe: 'NAO_SOLICITADO',
    proprietarioPessoaId: 'pessoa-1',
    orgaoId: null,
    observacoes: null,
    cartorio: null,
    cep: null,
    complemento: null,
    localidadeId: null,
    geoOrigem: null,
    dataInicio: null,
    dataPrevistaConclusao: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };
}

function pessoaBase(): PessoaProps {
  return {
    id: 'pessoa-1',
    tenantId: 'tenant-1',
    tipo: 'FISICA',
    documento: '52998224725',
    nome: 'João Silva',
    nomeFantasia: null,
    email: null,
    telefone: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as PessoaProps;
}

function paramBase(
  overrides: Partial<MontarDossieObraPrivadaParam> = {},
): MontarDossieObraPrivadaParam {
  const alvara: AlvaraProps = {
    id: 'alvara-1',
    tenantId: 'tenant-1',
    obraPrivadaId: 'obra-1',
    numero: '123',
    ano: 2026,
    tipo: TipoAlvara.CONSTRUCAO,
    motivo: MotivoAlvara.ORIGINAL,
    situacao: SituacaoRegistroAlvara.VIGENTE,
    dataEmissao: '2026-01-15',
    dataValidade: '2027-01-15',
    alvaraAnteriorId: null,
    areaTerrenoM2: null,
    areaConstruidaAprovadaM2: '120.00',
    uso: null,
    pavimentos: null,
    unidades: null,
    processoAdministrativo: null,
    arquivoId: null,
    observacoes: null,
    createdAt: new Date('2026-01-15T00:00:00.000Z'),
    updatedAt: new Date('2026-01-15T00:00:00.000Z'),
  };
  const responsavel: ResponsavelDetalhe = {
    id: 'resp-1',
    profissionalTecnicoId: 'prof-1',
    nome: 'Engenheira Ana',
    documento: '123',
    registro: 'CREA-1',
    titulo: null,
    papel: 'EXECUCAO',
    tipoDocumento: 'ART',
    numeroDocumento: 'ART-1',
    dataDocumento: null,
    arquivoId: null,
    dataInicio: null,
    dataBaixa: null,
    motivoBaixa: null,
    vigente: true,
  };
  const fiscalizacao: FiscalizacaoProps = {
    id: 'fis-1',
    tenantId: 'tenant-1',
    obraPrivadaId: 'obra-1',
    numero: 'FIS-1',
    tipo: TipoFiscalizacao.ROTINA,
    dataFiscalizacao: '2026-02-03',
    fiscalUsuarioId: 'user-1',
    resultado: ResultadoFiscalizacao.REGULAR,
    etapaConstatada: null,
    constatacoes: null,
    providencias: null,
    latitude: null,
    longitude: null,
    entulhoHaIrregularidade: null,
    entulhoVolumeEstimadoM3: null,
    entulhoLocal: null,
    entulhoPossuiCacamba: null,
    entulhoPossuiPgrcc: null,
    entulhoDestinacao: null,
    createdAt: new Date('2026-02-03T00:00:00.000Z'),
    updatedAt: new Date('2026-02-03T00:00:00.000Z'),
  };
  const auto: AutoInfracaoProps = {
    id: 'auto-1',
    tenantId: 'tenant-1',
    obraPrivadaId: 'obra-1',
    fiscalizacaoId: 'fis-1',
    numero: 'AUTO-1',
    tipo: TipoAutoInfracao.NOTIFICACAO,
    dataEmissao: '2026-02-04',
    prazoDias: 10,
    dataLimite: '2026-02-14',
    baseLegal: null,
    descricao: 'Regularizar',
    valorMulta: null,
    situacao: SituacaoAutoInfracao.ABERTO,
    dataEncerramento: null,
    observacoes: null,
    lavradoPorUsuarioId: 'user-1',
    createdAt: new Date('2026-02-04T00:00:00.000Z'),
    updatedAt: new Date('2026-02-04T00:00:00.000Z'),
  };
  const habiteSe: HabiteSeProps = {
    id: 'hab-1',
    tenantId: 'tenant-1',
    obraPrivadaId: 'obra-1',
    numero: 'HAB-1',
    dataEmissao: '2026-03-01',
    parcial: false,
    descricaoParcial: null,
    dataVistoria: null,
    vistoriadorUsuarioId: null,
    fiscalizacaoId: null,
    resultado: ResultadoHabiteSe.APROVADO,
    areaConstruidaExecutadaM2: '120.00',
    divergenciaProjeto: false,
    divergenciaDescricao: null,
    parecer: null,
    arquivoId: null,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };
  return {
    obra: obraBase(),
    proprietario: pessoaBase(),
    alvaras: [alvara],
    responsaveis: [responsavel],
    fiscalizacoes: [fiscalizacao],
    autos: [auto],
    habiteSe: [habiteSe],
    observacoes: [
      { texto: 'Visita realizada', criadoEm: new Date('2026-02-03T10:00:00.000Z') },
    ],
    ...overrides,
  };
}

describe('DossieObraPrivadaEntity', () => {
  it('monta obra com proprietário e normaliza datas string', () => {
    const dossie = DossieObraPrivadaEntity.montar(paramBase()).toObject();

    expect(dossie.obra.codigo).toBe('OBP-2026-0001');
    expect(dossie.obra.proprietarioNome).toBe('João Silva');
    expect(dossie.obra.proprietarioDocumento).toBe('52998224725');
    expect(dossie.alvaras[0].dataEmissao).toBe('2026-01-15');
    expect(dossie.alvaras[0].dataValidade).toBe('2027-01-15');
    expect(dossie.fiscalizacoes[0].dataFiscalizacao).toBe('2026-02-03');
    expect(dossie.autos[0].dataLimite).toBe('2026-02-14');
    expect(dossie.habiteSe[0].dataEmissao).toBe('2026-03-01');
  });

  it('normaliza datas hidratadas como Date (regressão iso.slice)', () => {
    const param = paramBase();
    const dossie = DossieObraPrivadaEntity.montar({
      ...param,
      alvaras: [
        {
          ...param.alvaras[0],
          dataEmissao: new Date(
            '2026-01-15T00:00:00.000Z',
          ) as unknown as string,
          dataValidade: new Date(
            '2027-01-15T00:00:00.000Z',
          ) as unknown as string,
        },
      ],
      responsaveis: [
        {
          ...param.responsaveis[0],
          dataBaixa: new Date(
            '2026-04-01T00:00:00.000Z',
          ) as unknown as string,
        },
      ],
    }).toObject();

    expect(dossie.alvaras[0].dataEmissao).toBe('2026-01-15');
    expect(dossie.alvaras[0].dataValidade).toBe('2027-01-15');
    expect(dossie.responsaveis[0].dataBaixa).toBe('2026-04-01');
  });

  it('usa travessão quando não há proprietário', () => {
    const dossie = DossieObraPrivadaEntity.montar(
      paramBase({ proprietario: null }),
    ).toObject();

    expect(dossie.obra.proprietarioNome).toBe('—');
    expect(dossie.obra.proprietarioDocumento).toBe('—');
  });

  it('lança OBRA_PRIVADA_NOT_FOUND sem obra', () => {
    const param = paramBase({
      obra: undefined as unknown as ObraPrivadaProps,
    });

    try {
      DossieObraPrivadaEntity.montar(param);
      fail('deveria lançar');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as { code: string }).code).toBe(
        ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
      );
    }
  });
});

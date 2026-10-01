import UseCase from '@/core/types/use_case';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';

export type ResponsavelDetalhe = {
  id: string;
  profissionalTecnicoId: string;
  nome: string | null;
  documento: string | null;
  registro: string | null;
  titulo: string | null;
  papel: string;
  tipoDocumento: string;
  numeroDocumento: string;
  dataDocumento: string | null;
  arquivoId: string | null;
  dataInicio: string | null;
  dataBaixa: string | null;
  motivoBaixa: string | null;
  vigente: boolean;
};

export type ObraPrivadaDerivados = {
  fiscalizada: boolean;
  autuada: boolean;
  embargada: boolean;
  autosAbertos: number;
  ultimaVisitaEm: string | null;
  diasSemVisita: number | null;
  etapaAtual: string | null;
  alvaraVigenteNumero: string | null;
  alvaraVigenteValidade: string | null;
  diasAteVencimentoAlvara: number | null;
};

export type ObraPrivadaDetalhe = {
  obra: ObraPrivadaEntity;
  proprietario: PessoaEntity | null;
  responsaveis: ResponsavelDetalhe[];
  derivados: ObraPrivadaDerivados;
};

export type DetalharObraParam = { id: string };

type IDetalharObraUseCase = UseCase<DetalharObraParam, ObraPrivadaDetalhe>;
export default IDetalharObraUseCase;

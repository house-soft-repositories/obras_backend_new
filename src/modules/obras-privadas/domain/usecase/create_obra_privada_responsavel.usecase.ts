import UseCase from '@/core/types/use_case';
import { ObraPrivadaResponsavelResponse } from '@/modules/obras-privadas/domain/usecase/obra_privada_responsavel.response';
import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type CreateObraPrivadaResponsavelParam = {
  tenantId: string;
  obraPrivadaId: string;
  profissionalTecnicoId: string;
  papel: PapelResponsavelTecnico;
  tipoDocumento: TipoDocumentoResponsabilidade;
  numeroDocumento: string;
  dataDocumento?: string | null;
  arquivoId?: string | null;
  dataInicio?: string | null;
  dataBaixa?: string | null;
  motivoBaixa?: string | null;
};

type ICreateObraPrivadaResponsavelUseCase = UseCase<
  CreateObraPrivadaResponsavelParam,
  ObraPrivadaResponsavelResponse
>;
export default ICreateObraPrivadaResponsavelUseCase;

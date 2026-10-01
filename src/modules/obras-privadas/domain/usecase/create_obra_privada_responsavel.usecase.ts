import UseCase from '@/core/types/use_case';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
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
  ObraPrivadaResponsavelEntity
>;
export default ICreateObraPrivadaResponsavelUseCase;

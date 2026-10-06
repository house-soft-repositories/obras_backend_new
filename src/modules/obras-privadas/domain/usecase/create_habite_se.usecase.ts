import UseCase from '@/core/types/use_case';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import { ResultadoHabiteSe } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type {
  ArquivoUploadItemParam,
  UploadArquivoPreparado,
} from '@/modules/obras-privadas/domain/usecase/iniciar_upload_arquivo.usecase';
export type CreateHabiteSeParam = {
  tenantId: string;
  obraPrivadaId: string;
  numero: string;
  dataEmissao?: string | null;
  parcial?: boolean;
  descricaoParcial?: string | null;
  dataVistoria?: string | null;
  vistoriadorUsuarioId?: string | null;
  fiscalizacaoId?: string | null;
  resultado: ResultadoHabiteSe;
  areaConstruidaExecutadaM2?: string | null;
  divergenciaProjeto?: boolean;
  divergenciaDescricao?: string | null;
  parecer?: string | null;
  arquivo?: ArquivoUploadItemParam;
  usuarioId?: string;
};
export type CreateHabiteSeResult = {
  habiteSe: HabiteSeEntity;
  arquivo?: UploadArquivoPreparado;
};
type ICreateHabiteSeUseCase = UseCase<
  CreateHabiteSeParam,
  CreateHabiteSeResult
>;
export default ICreateHabiteSeUseCase;

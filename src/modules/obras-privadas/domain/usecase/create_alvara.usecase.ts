import UseCase from '@/core/types/use_case';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import {
  MotivoAlvara,
  SituacaoRegistroAlvara,
  TipoAlvara,
  UsoEdificacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type {
  ArquivoUploadItemParam,
  UploadArquivoPreparado,
} from '@/modules/obras-privadas/domain/usecase/iniciar_upload_arquivo.usecase';

export type CreateAlvaraParam = {
  tenantId: string;
  obraPrivadaId: string;
  numero?: string | null;
  ano: number;
  tipo: TipoAlvara;
  motivo?: MotivoAlvara;
  situacao?: SituacaoRegistroAlvara;
  dataEmissao?: string | null;
  dataValidade?: string | null;
  alvaraAnteriorId?: string | null;
  areaTerrenoM2?: string | null;
  areaConstruidaAprovadaM2?: string | null;
  uso?: UsoEdificacao | null;
  pavimentos?: number | null;
  unidades?: number | null;
  processoAdministrativo?: string | null;
  arquivo?: ArquivoUploadItemParam;
  usuarioId?: string;
  observacoes?: string | null;
};

export type CreateAlvaraResult = {
  alvara: AlvaraEntity;
  arquivo?: UploadArquivoPreparado;
};

type ICreateAlvaraUseCase = UseCase<CreateAlvaraParam, CreateAlvaraResult>;
export default ICreateAlvaraUseCase;

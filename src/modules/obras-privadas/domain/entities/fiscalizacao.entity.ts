import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import {
  EtapaObraPrivada,
  LocalEntulho,
  ResultadoFiscalizacao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type FiscalizacaoProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  numero: string;
  tipo: TipoFiscalizacao;
  dataFiscalizacao: string;
  fiscalUsuarioId: string;
  resultado: ResultadoFiscalizacao;
  etapaConstatada: EtapaObraPrivada | null;
  constatacoes: string | null;
  providencias: string | null;
  latitude: string | null;
  longitude: string | null;
  entulhoHaIrregularidade: boolean | null;
  entulhoVolumeEstimadoM3: string | null;
  entulhoLocal: LocalEntulho | null;
  entulhoPossuiCacamba: boolean | null;
  entulhoPossuiPgrcc: boolean | null;
  entulhoDestinacao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateFiscalizacaoProps = Omit<
  FiscalizacaoProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export default class FiscalizacaoEntity {
  private constructor(private readonly props: FiscalizacaoProps) {}

  static create(props: CreateFiscalizacaoProps): FiscalizacaoEntity {
    if (
      !props.tenantId ||
      !props.obraPrivadaId ||
      !props.numero?.trim() ||
      !props.dataFiscalizacao ||
      !props.fiscalUsuarioId ||
      !Object.values(TipoFiscalizacao).includes(props.tipo) ||
      !Object.values(ResultadoFiscalizacao).includes(props.resultado)
    ) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.FISCALIZACAO_INVALID_INPUT,
      });
    }
    const now = new Date();
    return new FiscalizacaoEntity({
      ...props,
      id: randomUUID(),
      numero: props.numero.trim(),
      constatacoes: props.constatacoes?.trim() || null,
      providencias: props.providencias?.trim() || null,
      entulhoDestinacao: props.entulhoDestinacao?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: FiscalizacaoProps): FiscalizacaoEntity {
    return new FiscalizacaoEntity(props);
  }

  toObject(): FiscalizacaoProps {
    return { ...this.props };
  }

  get id(): string {
    return this.props.id;
  }
}

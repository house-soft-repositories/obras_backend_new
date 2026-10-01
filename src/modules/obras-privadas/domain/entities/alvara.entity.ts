import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import {
  MotivoAlvara,
  SituacaoRegistroAlvara,
  TipoAlvara,
  UsoEdificacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type AlvaraProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  numero: string | null;
  ano: number;
  tipo: TipoAlvara;
  motivo: MotivoAlvara;
  situacao: SituacaoRegistroAlvara;
  dataEmissao: string | null;
  dataValidade: string | null;
  alvaraAnteriorId: string | null;
  areaTerrenoM2: string | null;
  areaConstruidaAprovadaM2: string | null;
  uso: UsoEdificacao | null;
  pavimentos: number | null;
  unidades: number | null;
  processoAdministrativo: string | null;
  arquivoId: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAlvaraProps = Omit<
  AlvaraProps,
  'id' | 'motivo' | 'situacao' | 'createdAt' | 'updatedAt'
> & {
  motivo?: MotivoAlvara;
  situacao?: SituacaoRegistroAlvara;
};

export default class AlvaraEntity {
  private constructor(private readonly props: AlvaraProps) {}

  static create(props: CreateAlvaraProps): AlvaraEntity {
    if (!props.obraPrivadaId || !props.tenantId || !props.ano || !props.tipo) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.ALVARA_INVALID_INPUT,
      });
    }
    if (!Object.values(TipoAlvara).includes(props.tipo)) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.ALVARA_INVALID_INPUT,
      });
    }
    const now = new Date();
    return new AlvaraEntity({
      ...props,
      id: randomUUID(),
      motivo: props.motivo ?? MotivoAlvara.ORIGINAL,
      situacao: props.situacao ?? SituacaoRegistroAlvara.VIGENTE,
      numero: props.numero?.trim() || null,
      processoAdministrativo: props.processoAdministrativo?.trim() || null,
      observacoes: props.observacoes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: AlvaraProps): AlvaraEntity {
    return new AlvaraEntity(props);
  }

  toObject(): AlvaraProps {
    return { ...this.props };
  }

  get id(): string {
    return this.props.id;
  }
}

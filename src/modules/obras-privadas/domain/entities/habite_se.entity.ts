import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ResultadoHabiteSe } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type HabiteSeProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  numero: string;
  dataEmissao: string | null;
  parcial: boolean;
  descricaoParcial: string | null;
  dataVistoria: string | null;
  vistoriadorUsuarioId: string | null;
  fiscalizacaoId: string | null;
  resultado: ResultadoHabiteSe;
  areaConstruidaExecutadaM2: string | null;
  divergenciaProjeto: boolean;
  divergenciaDescricao: string | null;
  parecer: string | null;
  arquivoId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateHabiteSeProps = Omit<
  HabiteSeProps,
  'id' | 'parcial' | 'divergenciaProjeto' | 'createdAt' | 'updatedAt'
> & { parcial?: boolean; divergenciaProjeto?: boolean };

export default class HabiteSeEntity {
  private constructor(private readonly props: HabiteSeProps) {}
  static create(props: CreateHabiteSeProps): HabiteSeEntity {
    if (
      !props.tenantId ||
      !props.obraPrivadaId ||
      !props.numero?.trim() ||
      !Object.values(ResultadoHabiteSe).includes(props.resultado)
    )
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.HABITE_SE_INVALID_INPUT,
      });
    const now = new Date();
    return new HabiteSeEntity({
      ...props,
      id: randomUUID(),
      numero: props.numero.trim(),
      parcial: props.parcial ?? false,
      descricaoParcial: props.descricaoParcial?.trim() || null,
      divergenciaProjeto: props.divergenciaProjeto ?? false,
      divergenciaDescricao: props.divergenciaDescricao?.trim() || null,
      parecer: props.parecer?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(props: HabiteSeProps): HabiteSeEntity {
    return new HabiteSeEntity(props);
  }
  toObject(): HabiteSeProps {
    return { ...this.props };
  }
  get id(): string {
    return this.props.id;
  }
}

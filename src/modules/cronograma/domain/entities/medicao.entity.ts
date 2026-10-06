import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaDomainException from '@/modules/cronograma/exceptions/cronograma_domain.exception';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';

export interface MedicaoFonteProps {
  id: string;
  tenantId: string;
  medicaoId: string;
  fonteId: string;
  valor: number;
}

export interface MedicaoProps {
  id: string;
  tenantId: string;
  obraId: string;
  orgaoId: string | null;
  numero: number;
  tipo: TipoMedicao;
  dataMedicao: string;
  observacao: string | null;
  itens: MedicaoFonteProps[];
  criadoEm: Date;
  atualizadoEm: Date;
}

export default class MedicaoEntity {
  private constructor(private readonly props: MedicaoProps) {}

  static create(
    props: Omit<
      MedicaoProps,
      'id' | 'orgaoId' | 'itens' | 'observacao' | 'criadoEm' | 'atualizadoEm'
    > &
      Partial<Pick<MedicaoProps, 'observacao' | 'orgaoId'>> & {
        itens: Omit<MedicaoFonteProps, 'id' | 'tenantId' | 'medicaoId'>[];
      },
  ): MedicaoEntity {
    if (
      props.numero < 1 ||
      props.itens.length === 0 ||
      props.itens.some((item) => item.valor < 0)
    ) {
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    }
    const id = randomUUID();
    const now = new Date();
    return new MedicaoEntity({
      ...props,
      id,
      orgaoId: props.orgaoId ?? null,
      observacao: props.observacao?.trim() || null,
      criadoEm: now,
      atualizadoEm: now,
      itens: props.itens.map((item) => ({
        ...item,
        id: randomUUID(),
        tenantId: props.tenantId,
        medicaoId: id,
      })),
    });
  }

  static fromData(props: MedicaoProps): MedicaoEntity {
    return new MedicaoEntity(props);
  }

  update(
    props: Partial<
      Pick<
        MedicaoProps,
        'numero' | 'orgaoId' | 'tipo' | 'dataMedicao' | 'observacao'
      >
    > & {
      itens?: Omit<MedicaoFonteProps, 'id' | 'tenantId' | 'medicaoId'>[];
    },
  ): MedicaoEntity {
    const numero = props.numero ?? this.numero;
    const itens = props.itens
      ? props.itens.map((item) => ({
          ...item,
          id: randomUUID(),
          tenantId: this.tenantId,
          medicaoId: this.id,
        }))
      : this.itens;
    if (numero < 1 || itens.length === 0 || itens.some((item) => item.valor < 0))
      throw new CronogramaDomainException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
      });
    return new MedicaoEntity({
      ...this.props,
      numero,
      orgaoId: props.orgaoId === undefined ? this.orgaoId : props.orgaoId,
      tipo: props.tipo ?? this.tipo,
      dataMedicao: props.dataMedicao ?? this.dataMedicao,
      observacao:
        props.observacao === undefined
          ? this.observacao
          : props.observacao?.trim() || null,
      itens,
      atualizadoEm: new Date(),
    });
  }

  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get obraId() {
    return this.props.obraId;
  }
  get numero() {
    return this.props.numero;
  }
  get orgaoId() {
    return this.props.orgaoId;
  }
  get tipo() {
    return this.props.tipo;
  }
  get dataMedicao() {
    return this.props.dataMedicao;
  }
  get observacao() {
    return this.props.observacao;
  }
  get itens() {
    return [...this.props.itens];
  }
  get criadoEm() {
    return this.props.criadoEm;
  }
  get atualizadoEm() {
    return this.props.atualizadoEm;
  }
  toObject() {
    const { observacao, itens, ...props } = this.props;
    return {
      ...props,
      observacoes: observacao,
      fontes: itens.map(({ id, tenantId, medicaoId, fonteId, valor }) => ({
        id,
        tenantId,
        medicaoId,
        fonteId,
        valor,
      })),
    };
  }
}

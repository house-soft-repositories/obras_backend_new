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
  numero: number;
  tipo: TipoMedicao;
  dataMedicao: string;
  observacao: string | null;
  itens: MedicaoFonteProps[];
  criadoEm: Date;
}

export default class MedicaoEntity {
  private constructor(private readonly props: MedicaoProps) {}

  static create(
    props: Omit<MedicaoProps, 'id' | 'itens' | 'observacao' | 'criadoEm'> &
      Partial<Pick<MedicaoProps, 'observacao'>> & {
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
    return new MedicaoEntity({
      ...props,
      id,
      observacao: props.observacao?.trim() || null,
      criadoEm: new Date(),
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
  toObject() {
    return { ...this.props, itens: this.itens };
  }
}

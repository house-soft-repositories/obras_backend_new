import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import { assertValorPositivo } from '@/modules/obras/domain/entities/empenho.entity';

export interface PagamentoProps {
  id: string;
  tenantId: string;
  empenhoId: string;
  liquidacaoId: string;
  fonteId: string;
  numeroOrdemBancaria: string;
  dataOrdemBancaria: string;
  valor: number;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePagamentoProps = Omit<PagamentoProps, 'id' | 'observacoes' | 'createdAt' | 'updatedAt'> & {
  observacoes?: string | null;
};

export default class PagamentoEntity {
  private constructor(private readonly props: PagamentoProps) {}

  static create(p: CreatePagamentoProps): PagamentoEntity {
    if (!p.empenhoId || !p.liquidacaoId || !p.fonteId || !p.numeroOrdemBancaria?.trim() || !p.dataOrdemBancaria)
      throw new ObraDomainException({ code: ErrorCodeConstants.PAGAMENTO_INVALID_INPUT });
    assertValorPositivo(p.valor, ErrorCodeConstants.PAGAMENTO_INVALID_VALOR);
    const now = new Date();
    return new PagamentoEntity({
      ...p,
      id: randomUUID(),
      numeroOrdemBancaria: p.numeroOrdemBancaria.trim(),
      observacoes: p.observacoes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(p: PagamentoProps): PagamentoEntity {
    return new PagamentoEntity(p);
  }

  update(p: Partial<Pick<PagamentoProps, 'fonteId' | 'numeroOrdemBancaria' | 'dataOrdemBancaria' | 'valor' | 'observacoes'>>): void {
    const props = this.props as unknown as Record<string, unknown>;
    if (p.fonteId !== undefined) {
      if (!p.fonteId) throw new ObraDomainException({ code: ErrorCodeConstants.PAGAMENTO_INVALID_INPUT });
      props['fonteId'] = p.fonteId;
    }
    if (p.numeroOrdemBancaria !== undefined) {
      if (!p.numeroOrdemBancaria?.trim()) throw new ObraDomainException({ code: ErrorCodeConstants.PAGAMENTO_INVALID_INPUT });
      props['numeroOrdemBancaria'] = p.numeroOrdemBancaria.trim();
    }
    if (p.dataOrdemBancaria !== undefined) {
      if (!p.dataOrdemBancaria) throw new ObraDomainException({ code: ErrorCodeConstants.PAGAMENTO_INVALID_INPUT });
      props['dataOrdemBancaria'] = p.dataOrdemBancaria;
    }
    if (p.valor !== undefined) {
      assertValorPositivo(p.valor, ErrorCodeConstants.PAGAMENTO_INVALID_VALOR);
      props['valor'] = p.valor;
    }
    if (p.observacoes !== undefined) props['observacoes'] = p.observacoes?.trim() || null;
    props['updatedAt'] = new Date();
  }

  toObject(): PagamentoProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get empenhoId() { return this.props.empenhoId; }
  get liquidacaoId() { return this.props.liquidacaoId; }
  get fonteId() { return this.props.fonteId; }
  get numeroOrdemBancaria() { return this.props.numeroOrdemBancaria; }
  get dataOrdemBancaria() { return this.props.dataOrdemBancaria; }
  get valor() { return this.props.valor; }
  get observacoes() { return this.props.observacoes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

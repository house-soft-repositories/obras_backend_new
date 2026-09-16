import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import { assertValorPositivo } from '@/modules/obras/domain/entities/empenho.entity';

export interface LiquidacaoProps {
  id: string;
  tenantId: string;
  empenhoId: string;
  fonteId: string;
  numero: string;
  dataLiquidacao: string;
  valor: number;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateLiquidacaoProps = Omit<LiquidacaoProps, 'id' | 'observacoes' | 'createdAt' | 'updatedAt'> & {
  observacoes?: string | null;
};

export default class LiquidacaoEntity {
  private constructor(private readonly props: LiquidacaoProps) {}

  static create(p: CreateLiquidacaoProps): LiquidacaoEntity {
    if (!p.empenhoId || !p.fonteId || !p.numero?.trim() || !p.dataLiquidacao)
      throw new ObraDomainException({ code: ErrorCodeConstants.LIQUIDACAO_INVALID_INPUT });
    assertValorPositivo(p.valor, ErrorCodeConstants.LIQUIDACAO_INVALID_VALOR);
    const now = new Date();
    return new LiquidacaoEntity({
      ...p,
      id: randomUUID(),
      numero: p.numero.trim(),
      observacoes: p.observacoes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(p: LiquidacaoProps): LiquidacaoEntity {
    return new LiquidacaoEntity(p);
  }

  update(p: Partial<Pick<LiquidacaoProps, 'fonteId' | 'numero' | 'dataLiquidacao' | 'valor' | 'observacoes'>>): void {
    const props = this.props as unknown as Record<string, unknown>;
    if (p.fonteId !== undefined) {
      if (!p.fonteId) throw new ObraDomainException({ code: ErrorCodeConstants.LIQUIDACAO_INVALID_INPUT });
      props['fonteId'] = p.fonteId;
    }
    if (p.numero !== undefined) {
      if (!p.numero?.trim()) throw new ObraDomainException({ code: ErrorCodeConstants.LIQUIDACAO_INVALID_INPUT });
      props['numero'] = p.numero.trim();
    }
    if (p.dataLiquidacao !== undefined) {
      if (!p.dataLiquidacao) throw new ObraDomainException({ code: ErrorCodeConstants.LIQUIDACAO_INVALID_INPUT });
      props['dataLiquidacao'] = p.dataLiquidacao;
    }
    if (p.valor !== undefined) {
      assertValorPositivo(p.valor, ErrorCodeConstants.LIQUIDACAO_INVALID_VALOR);
      props['valor'] = p.valor;
    }
    if (p.observacoes !== undefined) props['observacoes'] = p.observacoes?.trim() || null;
    props['updatedAt'] = new Date();
  }

  toObject(): LiquidacaoProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get empenhoId() { return this.props.empenhoId; }
  get fonteId() { return this.props.fonteId; }
  get numero() { return this.props.numero; }
  get dataLiquidacao() { return this.props.dataLiquidacao; }
  get valor() { return this.props.valor; }
  get observacoes() { return this.props.observacoes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

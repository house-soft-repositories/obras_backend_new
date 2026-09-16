import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import { TipoEmpenho } from '@/modules/obras/domain/enums/tipo_empenho.enum';

export interface EmpenhoProps {
  id: string;
  tenantId: string;
  obraId: string;
  fonteId: string;
  tipo: TipoEmpenho;
  numero: string;
  dataEmpenho: string;
  valor: number;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEmpenhoProps = Omit<EmpenhoProps, 'id' | 'observacoes' | 'createdAt' | 'updatedAt'> & {
  observacoes?: string | null;
};

export function assertValorPositivo(valor: number, code: string): void {
  if (!Number.isFinite(valor) || valor <= 0)
    throw new ObraDomainException({ code });
}

export default class EmpenhoEntity {
  private constructor(private readonly props: EmpenhoProps) {}

  static create(p: CreateEmpenhoProps): EmpenhoEntity {
    if (!p.obraId || !p.fonteId || !p.numero?.trim() || !p.dataEmpenho)
      throw new ObraDomainException({ code: ErrorCodeConstants.EMPENHO_INVALID_INPUT });
    if (!Object.values(TipoEmpenho).includes(p.tipo))
      throw new ObraDomainException({ code: ErrorCodeConstants.EMPENHO_INVALID_INPUT });
    assertValorPositivo(p.valor, ErrorCodeConstants.EMPENHO_INVALID_VALOR);
    const now = new Date();
    return new EmpenhoEntity({
      ...p,
      id: randomUUID(),
      numero: p.numero.trim(),
      observacoes: p.observacoes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(p: EmpenhoProps): EmpenhoEntity {
    return new EmpenhoEntity(p);
  }

  update(p: Partial<Pick<EmpenhoProps, 'fonteId' | 'tipo' | 'numero' | 'dataEmpenho' | 'valor' | 'observacoes'>>): void {
    const props = this.props as unknown as Record<string, unknown>;
    if (p.fonteId !== undefined) {
      if (!p.fonteId) throw new ObraDomainException({ code: ErrorCodeConstants.EMPENHO_INVALID_INPUT });
      props['fonteId'] = p.fonteId;
    }
    if (p.tipo !== undefined) {
      if (!Object.values(TipoEmpenho).includes(p.tipo))
        throw new ObraDomainException({ code: ErrorCodeConstants.EMPENHO_INVALID_INPUT });
      props['tipo'] = p.tipo;
    }
    if (p.numero !== undefined) {
      if (!p.numero?.trim()) throw new ObraDomainException({ code: ErrorCodeConstants.EMPENHO_INVALID_INPUT });
      props['numero'] = p.numero.trim();
    }
    if (p.dataEmpenho !== undefined) {
      if (!p.dataEmpenho) throw new ObraDomainException({ code: ErrorCodeConstants.EMPENHO_INVALID_INPUT });
      props['dataEmpenho'] = p.dataEmpenho;
    }
    if (p.valor !== undefined) {
      assertValorPositivo(p.valor, ErrorCodeConstants.EMPENHO_INVALID_VALOR);
      props['valor'] = p.valor;
    }
    if (p.observacoes !== undefined) props['observacoes'] = p.observacoes?.trim() || null;
    props['updatedAt'] = new Date();
  }

  toObject(): EmpenhoProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get fonteId() { return this.props.fonteId; }
  get tipo() { return this.props.tipo; }
  get numero() { return this.props.numero; }
  get dataEmpenho() { return this.props.dataEmpenho; }
  get valor() { return this.props.valor; }
  get observacoes() { return this.props.observacoes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

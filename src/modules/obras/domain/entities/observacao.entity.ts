import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';

export interface ObservacaoProps {
  id: string;
  tenantId: string;
  obraId: string;
  texto: string;
  autorUsuarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default class ObservacaoEntity {
  private constructor(private readonly props: ObservacaoProps) {}

  static create(p: {
    tenantId: string;
    obraId: string;
    texto: string;
    autorUsuarioId: string;
  }): ObservacaoEntity {
    const texto = p.texto?.trim();
    if (!texto || texto.length < 1 || texto.length > 2000)
      throw new ObraDomainException({
        code: ErrorCodeConstants.OBSERVACAO_INVALID_TEXTO,
      });
    if (!p.obraId) throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_NOT_FOUND });
    if (!p.autorUsuarioId)
      throw new ObraDomainException({ code: ErrorCodeConstants.OBSERVACAO_INVALID_TEXTO });
    const now = new Date();
    return new ObservacaoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      obraId: p.obraId,
      texto,
      autorUsuarioId: p.autorUsuarioId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(p: ObservacaoProps): ObservacaoEntity {
    return new ObservacaoEntity(p);
  }

  updateTexto(texto: string): void {
    const t = texto?.trim();
    if (!t || t.length < 1 || t.length > 2000)
      throw new ObraDomainException({
        code: ErrorCodeConstants.OBSERVACAO_INVALID_TEXTO,
      });
    (this.props as { texto: string }).texto = t;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }

  toObject(): ObservacaoProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get obraId() { return this.props.obraId; }
  get texto() { return this.props.texto; }
  get autorUsuarioId() { return this.props.autorUsuarioId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

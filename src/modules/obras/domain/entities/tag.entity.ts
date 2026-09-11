import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';

export interface TagProps {
  id: string;
  tenantId: string;
  nome: string;
  createdAt: Date;
}

export default class TagEntity {
  private constructor(private readonly props: TagProps) {}

  static create(p: { tenantId: string; nome: string }): TagEntity {
    const nome = p.nome?.trim().toLowerCase();
    if (!nome || nome.length < 2 || nome.length > 40)
      throw new ObraDomainException({ code: ErrorCodeConstants.OBRA_TAG_INVALID });
    return new TagEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      nome,
      createdAt: new Date(),
    });
  }

  static fromData(p: TagProps): TagEntity {
    return new TagEntity(p);
  }

  toObject(): TagProps {
    return { ...this.props };
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get nome() { return this.props.nome; }
  get createdAt() { return this.props.createdAt; }
}

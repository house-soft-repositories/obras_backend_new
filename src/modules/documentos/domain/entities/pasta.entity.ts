import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PastaDomainException from '@/modules/documentos/exceptions/pasta_domain.exception';

export const NOME_PASTA_RAIZ = 'Raiz';

export interface PastaProps {
  id: string;
  obraId: string;
  pastaPaiId: string | null;
  nome: string;
  criadoPorUsuarioId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePastaProps = Pick<
  PastaProps,
  'obraId' | 'pastaPaiId' | 'nome' | 'criadoPorUsuarioId'
>;

export default class PastaEntity {
  private constructor(private readonly props: PastaProps) {}

  static create(props: CreatePastaProps): PastaEntity {
    this.validateObraId(props.obraId);
    this.validateNome(props.nome);
    const now = new Date();
    return new PastaEntity({
      id: randomUUID(),
      obraId: props.obraId,
      pastaPaiId: props.pastaPaiId ?? null,
      nome: props.nome.trim(),
      criadoPorUsuarioId: props.criadoPorUsuarioId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createRoot(obraId: string): PastaEntity {
    return PastaEntity.create({
      obraId,
      pastaPaiId: null,
      nome: NOME_PASTA_RAIZ,
      criadoPorUsuarioId: null,
    });
  }

  static fromData(props: PastaProps): PastaEntity {
    return new PastaEntity(props);
  }

  toObject(): PastaProps {
    return { ...this.props };
  }

  private static validateObraId(obraId: string): void {
    if (!obraId?.trim())
      throw new PastaDomainException({
        code: ErrorCodeConstants.PASTA_INVALID_NAME,
      });
  }

  private static validateNome(nome: string): void {
    if (!nome?.trim() || nome.trim().length > 120)
      throw new PastaDomainException({
        code: ErrorCodeConstants.PASTA_INVALID_NAME,
      });
  }

  get id() {
    return this.props.id;
  }
  get obraId() {
    return this.props.obraId;
  }
  get pastaPaiId() {
    return this.props.pastaPaiId;
  }
  get nome() {
    return this.props.nome;
  }
  get criadoPorUsuarioId() {
    return this.props.criadoPorUsuarioId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

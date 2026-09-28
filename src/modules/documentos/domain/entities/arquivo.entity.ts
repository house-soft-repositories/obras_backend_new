import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ArquivoDomainException from '@/modules/documentos/exceptions/arquivo_domain.exception';

export interface ArquivoProps {
  id: string;
  obraId: string;
  pastaId: string;
  nome: string;
  descricao: string | null;
  nomeOriginal: string;
  mimeType: string | null;
  tamanhoBytes: string | null;
  storageKey: string;
  attachmentId: string | null;
  enviadoPorUsuarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateArquivoProps = Pick<
  ArquivoProps,
  | 'obraId'
  | 'pastaId'
  | 'nome'
  | 'nomeOriginal'
  | 'storageKey'
  | 'enviadoPorUsuarioId'
> &
  Partial<
    Pick<
      ArquivoProps,
      'descricao' | 'mimeType' | 'tamanhoBytes' | 'attachmentId'
    >
  >;

export default class ArquivoEntity {
  private constructor(private readonly props: ArquivoProps) {}

  static create(props: CreateArquivoProps): ArquivoEntity {
    this.validateRequired(props.obraId);
    this.validateRequired(props.pastaId);
    this.validateNome(props.nome);
    this.validateRequired(props.nomeOriginal);
    this.validateRequired(props.storageKey);
    this.validateRequired(props.enviadoPorUsuarioId);
    const now = new Date();
    return new ArquivoEntity({
      id: randomUUID(),
      obraId: props.obraId,
      pastaId: props.pastaId,
      nome: props.nome.trim(),
      descricao: props.descricao ?? null,
      nomeOriginal: props.nomeOriginal,
      mimeType: props.mimeType ?? null,
      tamanhoBytes: props.tamanhoBytes ?? null,
      storageKey: props.storageKey,
      attachmentId: props.attachmentId ?? null,
      enviadoPorUsuarioId: props.enviadoPorUsuarioId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: ArquivoProps): ArquivoEntity {
    return new ArquivoEntity(props);
  }

  confirmar(tamanhoBytes: string, mimeType?: string | null): ArquivoEntity {
    if (!tamanhoBytes?.trim())
      throw new ArquivoDomainException({
        code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
      });
    return new ArquivoEntity({
      ...this.props,
      tamanhoBytes,
      mimeType: mimeType ?? this.props.mimeType,
      updatedAt: new Date(),
    });
  }

  vincularAttachment(attachmentId: string): ArquivoEntity {
    ArquivoEntity.validateRequired(attachmentId);
    return new ArquivoEntity({
      ...this.props,
      attachmentId,
      updatedAt: new Date(),
    });
  }

  editar(data: { nome?: string; descricao?: string | null }): ArquivoEntity {
    if (data.nome !== undefined) ArquivoEntity.validateNome(data.nome);
    return new ArquivoEntity({
      ...this.props,
      nome: data.nome !== undefined ? data.nome.trim() : this.props.nome,
      descricao:
        data.descricao !== undefined ? data.descricao : this.props.descricao,
      updatedAt: new Date(),
    });
  }

  mover(pastaId: string, storageKey?: string): ArquivoEntity {
    ArquivoEntity.validateRequired(pastaId);
    if (storageKey !== undefined) ArquivoEntity.validateRequired(storageKey);
    return new ArquivoEntity({
      ...this.props,
      pastaId,
      storageKey: storageKey ?? this.props.storageKey,
      updatedAt: new Date(),
    });
  }

  toObject(): ArquivoProps {
    return { ...this.props };
  }

  get confirmado(): boolean {
    return this.props.tamanhoBytes !== null;
  }

  private static validateNome(nome: string): void {
    if (!nome?.trim() || nome.trim().length > 255)
      throw new ArquivoDomainException({
        code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
      });
  }

  private static validateRequired(value: string): void {
    if (!value?.trim())
      throw new ArquivoDomainException({
        code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
      });
  }

  get id() {
    return this.props.id;
  }
  get obraId() {
    return this.props.obraId;
  }
  get pastaId() {
    return this.props.pastaId;
  }
  get nome() {
    return this.props.nome;
  }
  get descricao() {
    return this.props.descricao;
  }
  get nomeOriginal() {
    return this.props.nomeOriginal;
  }
  get mimeType() {
    return this.props.mimeType;
  }
  get tamanhoBytes() {
    return this.props.tamanhoBytes;
  }
  get storageKey() {
    return this.props.storageKey;
  }
  get attachmentId() {
    return this.props.attachmentId;
  }
  get enviadoPorUsuarioId() {
    return this.props.enviadoPorUsuarioId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type ObraPrivadaArquivoProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  vinculo: VinculoArquivoPrivado;
  vinculoId: string | null;
  categoria: CategoriaArquivoPrivado;
  nome: string;
  descricao: string | null;
  nomeOriginal: string;
  mimeType: string | null;
  tamanhoBytes: string | null;
  storageKey: string;
  ordem: number;
  latitude: string | null;
  longitude: string | null;
  capturadoEm: Date | null;
  enviadoPorUsuarioId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateObraPrivadaArquivoProps = Pick<
  ObraPrivadaArquivoProps,
  | 'tenantId'
  | 'obraPrivadaId'
  | 'vinculo'
  | 'nomeOriginal'
  | 'storageKey'
  | 'enviadoPorUsuarioId'
> &
  Partial<
    Pick<
      ObraPrivadaArquivoProps,
      | 'vinculoId'
      | 'categoria'
      | 'nome'
      | 'descricao'
      | 'mimeType'
      | 'ordem'
      | 'latitude'
      | 'longitude'
      | 'capturadoEm'
    >
  >;

export default class ObraPrivadaArquivoEntity {
  private constructor(private readonly props: ObraPrivadaArquivoProps) {}

  static create(
    props: CreateObraPrivadaArquivoProps,
  ): ObraPrivadaArquivoEntity {
    if (
      !props.tenantId ||
      !props.obraPrivadaId ||
      !props.nomeOriginal?.trim() ||
      !props.storageKey?.trim() ||
      !props.enviadoPorUsuarioId
    ) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    }
    if (!Object.values(VinculoArquivoPrivado).includes(props.vinculo)) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    }
    const categoria = props.categoria ?? CategoriaArquivoPrivado.DOCUMENTO;
    if (!Object.values(CategoriaArquivoPrivado).includes(categoria)) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    }
    const now = new Date();
    return new ObraPrivadaArquivoEntity({
      id: randomUUID(),
      tenantId: props.tenantId,
      obraPrivadaId: props.obraPrivadaId,
      vinculo: props.vinculo,
      vinculoId: props.vinculoId ?? null,
      categoria,
      nome: props.nome?.trim() || props.nomeOriginal.trim(),
      descricao: props.descricao?.trim() || null,
      nomeOriginal: props.nomeOriginal.trim(),
      mimeType: props.mimeType ?? null,
      tamanhoBytes: null,
      storageKey: props.storageKey,
      ordem: props.ordem ?? 0,
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      capturadoEm: props.capturadoEm ?? null,
      enviadoPorUsuarioId: props.enviadoPorUsuarioId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: ObraPrivadaArquivoProps): ObraPrivadaArquivoEntity {
    return new ObraPrivadaArquivoEntity(props);
  }

  confirmar(
    tamanhoBytes: string,
    mimeType?: string | null,
  ): ObraPrivadaArquivoEntity {
    if (!tamanhoBytes?.trim())
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    return new ObraPrivadaArquivoEntity({
      ...this.props,
      tamanhoBytes,
      mimeType: mimeType ?? this.props.mimeType,
      updatedAt: new Date(),
    });
  }

  editar(data: {
    nome?: string;
    descricao?: string | null;
    ordem?: number;
    categoria?: CategoriaArquivoPrivado;
  }): ObraPrivadaArquivoEntity {
    if (data.nome !== undefined && !data.nome?.trim())
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    if (
      data.categoria !== undefined &&
      !Object.values(CategoriaArquivoPrivado).includes(data.categoria)
    )
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    if (data.ordem !== undefined && (!Number.isInteger(data.ordem) || data.ordem < 0))
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
      });
    return new ObraPrivadaArquivoEntity({
      ...this.props,
      nome: data.nome !== undefined ? data.nome.trim() : this.props.nome,
      descricao: data.descricao !== undefined ? data.descricao : this.props.descricao,
      ordem: data.ordem !== undefined ? data.ordem : this.props.ordem,
      categoria:
        data.categoria !== undefined ? data.categoria : this.props.categoria,
      updatedAt: new Date(),
    });
  }

  toObject(): ObraPrivadaArquivoProps {
    return { ...this.props };
  }

  get id(): string {
    return this.props.id;
  }
  get storageKey(): string {
    return this.props.storageKey;
  }
}

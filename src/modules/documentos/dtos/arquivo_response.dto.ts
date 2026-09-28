import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

export default class ArquivoResponseDto {
  id: string;

  obraId: string;

  pastaId: string;

  nome: string;

  descricao: string | null;

  nomeOriginal: string;

  mimeType: string | null;

  tamanhoBytes: string | null;

  confirmado: boolean;

  createdAt: Date;

  updatedAt: Date;

  static fromEntity(e: ArquivoEntity): ArquivoResponseDto {
    const dto = new ArquivoResponseDto();
    const o = e.toObject();
    dto.id = o.id;
    dto.obraId = o.obraId;
    dto.pastaId = o.pastaId;
    dto.nome = o.nome;
    dto.descricao = o.descricao;
    dto.nomeOriginal = o.nomeOriginal;
    dto.mimeType = o.mimeType;
    dto.tamanhoBytes = o.tamanhoBytes;
    dto.confirmado = e.confirmado;
    dto.createdAt = o.createdAt;
    dto.updatedAt = o.updatedAt;
    return dto;
  }
}

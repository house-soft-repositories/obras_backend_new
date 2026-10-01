import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';

export default class ObraPrivadaArquivoResponseDto {
  id: string;
  obraPrivadaId: string;
  vinculo: string;
  vinculoId: string | null;
  categoria: string;
  nome: string;
  descricao: string | null;
  nomeOriginal: string;
  mimeType: string | null;
  tamanhoBytes: string | null;
  ordem: number;
  latitude: string | null;
  longitude: string | null;
  capturadoEm: Date | null;
  enviadoPorUsuarioId: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: ObraPrivadaArquivoEntity): ObraPrivadaArquivoResponseDto {
    const value = entity.toObject();
    const dto = new ObraPrivadaArquivoResponseDto();
    dto.id = value.id;
    dto.obraPrivadaId = value.obraPrivadaId;
    dto.vinculo = value.vinculo;
    dto.vinculoId = value.vinculoId;
    dto.categoria = value.categoria;
    dto.nome = value.nome;
    dto.descricao = value.descricao;
    dto.nomeOriginal = value.nomeOriginal;
    dto.mimeType = value.mimeType;
    dto.tamanhoBytes = value.tamanhoBytes;
    dto.ordem = value.ordem;
    dto.latitude = value.latitude;
    dto.longitude = value.longitude;
    dto.capturadoEm = value.capturadoEm;
    dto.enviadoPorUsuarioId = value.enviadoPorUsuarioId;
    dto.createdAt = value.createdAt;
    dto.updatedAt = value.updatedAt;
    return dto;
  }
}

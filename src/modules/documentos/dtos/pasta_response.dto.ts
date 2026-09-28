import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';

export default class PastaResponseDto {
  id: string;

  obraId: string;

  pastaPaiId: string | null;

  nome: string;

  criadoPorUsuarioId: string | null;

  createdAt: Date;

  updatedAt: Date;

  static fromEntity(e: PastaEntity): PastaResponseDto {
    const dto = new PastaResponseDto();
    const o = e.toObject();
    dto.id = o.id;
    dto.obraId = o.obraId;
    dto.pastaPaiId = o.pastaPaiId;
    dto.nome = o.nome;
    dto.criadoPorUsuarioId = o.criadoPorUsuarioId;
    dto.createdAt = o.createdAt;
    dto.updatedAt = o.updatedAt;
    return dto;
  }
}

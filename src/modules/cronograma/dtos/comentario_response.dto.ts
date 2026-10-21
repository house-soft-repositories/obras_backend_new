import { ApiProperty } from '@nestjs/swagger';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';

export default class ComentarioResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() obraId: string;
  @ApiProperty() estagioId: string;
  @ApiProperty() texto: string;
  @ApiProperty() autorUsuarioId: string;
  @ApiProperty() createdAt: string;

  static fromEntity(e: EstagioComentarioEntity): ComentarioResponseDto {
    const o = e.toObject();
    return {
      id: o.id,
      obraId: o.obraId,
      estagioId: o.estagioId,
      texto: o.texto,
      autorUsuarioId: o.autorUsuarioId,
      createdAt: o.criadoEm?.toISOString() ?? new Date().toISOString(),
    };
  }
}
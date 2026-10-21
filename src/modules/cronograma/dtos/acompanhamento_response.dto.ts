import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';

export default class AcompanhamentoResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() obraId: string;
  @ApiProperty() estagioId: string;
  @ApiProperty() percentual: number;
  @ApiProperty() data: string;
  @ApiPropertyOptional() observacao: string | null;
  @ApiProperty() autorUsuarioId: string;
  @ApiProperty() createdAt: string;

  static fromEntity(e: EstagioAcompanhamentoEntity): AcompanhamentoResponseDto {
    const o = e.toObject();
    return {
      id: o.id,
      obraId: o.obraId,
      estagioId: o.estagioId,
      percentual: o.percentual,
      data: o.data,
      observacao: o.observacao,
      autorUsuarioId: o.autorUsuarioId,
      createdAt: o.criadoEm?.toISOString() ?? new Date().toISOString(),
    };
  }
}
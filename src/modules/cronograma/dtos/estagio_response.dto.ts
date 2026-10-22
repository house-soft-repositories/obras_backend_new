import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EstagioStatus,
  ModoDuracao,
} from '@/modules/cronograma/domain/enums/cronograma.enums';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';

export default class EstagioResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() obraId: string;
  @ApiProperty() nome: string;
  @ApiProperty() posicao: number;
  @ApiProperty() ativo: boolean;
  @ApiProperty({ enum: EstagioStatus }) status: EstagioStatus;
  @ApiProperty({ enum: ModoDuracao }) modoDuracao: ModoDuracao;
  @ApiPropertyOptional() dataInicio: string | null;
  @ApiPropertyOptional() dataFim: string | null;
  @ApiPropertyOptional() percentualDireto: number | null;
  @ApiPropertyOptional() responsavelUsuarioId: string | null;
  @ApiPropertyOptional() estagioPaiId: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  static fromEntity(e: EstagioEntity): EstagioResponseDto {
    const o = e.toObject();
    return {
      id: o.id,
      obraId: o.obraId,
      nome: o.nome,
      posicao: o.posicao,
      ativo: o.ativo,
      status: o.status,
      modoDuracao: o.modoDuracao,
      dataInicio: o.dataInicio,
      dataFim: o.dataFim,
      percentualDireto: o.percentualDireto,
      responsavelUsuarioId: o.responsavelUsuarioId,
      estagioPaiId: o.estagioPaiId,
      createdAt: o.criadoEm?.toISOString() ?? new Date().toISOString(),
      updatedAt: o.atualizadoEm?.toISOString() ?? new Date().toISOString(),
    };
  }
}

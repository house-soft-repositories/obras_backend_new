import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';

export class MedicaoFonteResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() fonteId: string;
  @ApiProperty() valor: number;
}

export default class MedicaoResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() obraId: string;
  @ApiPropertyOptional() orgaoId: string | null;
  @ApiProperty() numero: number;
  @ApiProperty({ enum: TipoMedicao }) tipo: TipoMedicao;
  @ApiProperty() dataMedicao: string;
  @ApiPropertyOptional() observacoes: string | null;
  @ApiProperty({ type: [MedicaoFonteResponseDto] }) fontes: MedicaoFonteResponseDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  static fromEntity(e: MedicaoEntity): MedicaoResponseDto {
    const o = e.toObject();
    return {
      id: o.id,
      obraId: o.obraId,
      orgaoId: o.orgaoId,
      numero: o.numero,
      tipo: o.tipo,
      dataMedicao: o.dataMedicao,
      observacoes: o.observacoes,
      fontes: o.fontes.map((item) => ({
        id: item.id,
        fonteId: item.fonteId,
        valor: item.valor,
      })),
      createdAt: o.criadoEm?.toISOString() ?? new Date().toISOString(),
      updatedAt: o.atualizadoEm?.toISOString() ?? new Date().toISOString(),
    };
  }
}
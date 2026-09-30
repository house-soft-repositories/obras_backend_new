import { CONSELHOS_PROFISSIONAIS } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import type { ConselhoProfissional } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export default class ProfissionalTecnicoDto {
  @ApiProperty() id: string;
  @ApiProperty() pessoaId: string;
  @ApiProperty() nome: string;
  @ApiProperty() documento: string;
  @ApiProperty({ enum: CONSELHOS_PROFISSIONAIS }) conselho: ConselhoProfissional;
  @ApiProperty() numeroRegistro: string;
  @ApiPropertyOptional() ufRegistro: string | null;
  @ApiPropertyOptional() titulo: string | null;
  @ApiProperty() ativo: boolean;
  @ApiProperty() registro: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

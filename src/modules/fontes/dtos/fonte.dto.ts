import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export default class FonteDto {
  @ApiProperty() id: string;
  @ApiProperty() nome: string;
  @ApiPropertyOptional() descricao: string | null;
  @ApiPropertyOptional() codigo: string | null;
  @ApiPropertyOptional() tipo: string | null;
  @ApiPropertyOptional() valorPrevisto: string | null;
  @ApiPropertyOptional() vigencia: string | null;
  @ApiProperty() ativo: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

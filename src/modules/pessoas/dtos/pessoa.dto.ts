import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export default class PessoaDto {
  @ApiProperty() id:string;
  @ApiProperty() tipo:string;
  @ApiProperty() documento:string;
  @ApiProperty() nome:string;
  @ApiPropertyOptional() nomeFantasia:string|null;
  @ApiPropertyOptional() email:string|null;
  @ApiProperty() ativo:boolean;
  @ApiProperty() createdAt:string;
  @ApiProperty() updatedAt:string;
}

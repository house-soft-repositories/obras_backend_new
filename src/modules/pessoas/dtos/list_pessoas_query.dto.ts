import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import { TIPOS_PESSOA } from '@/modules/pessoas/domain/entities/pessoa.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
export default class ListPessoasQueryDto extends PaginationOptionsDto {
  @ApiPropertyOptional({ description: 'Nome, nome fantasia ou documento' })
  @IsOptional()
  @IsString()
  declare busca?: string;
  @ApiPropertyOptional({ description: 'FISICA ou JURIDICA' })
  @IsOptional()
  @IsString()
  @IsIn(TIPOS_PESSOA)
  declare tipo?: string;
}

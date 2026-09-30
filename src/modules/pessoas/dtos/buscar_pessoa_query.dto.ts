import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import { TIPOS_PESSOA } from '@/modules/pessoas/domain/entities/pessoa.entity';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
export default class BuscarPessoaQueryDto extends PaginationOptionsDto {
  @ApiProperty({ description: 'Nome, CPF ou CNPJ; mínimo de 3 caracteres' })
  @IsString({ message: ErrorCodeConstants.PESSOA_INVALID_BUSCA })
  @MinLength(3, { message: ErrorCodeConstants.PESSOA_INVALID_BUSCA })
  declare q: string;
  @ApiPropertyOptional({ description: 'FISICA ou JURIDICA' })
  @IsOptional()
  @IsString()
  @IsIn(TIPOS_PESSOA)
  declare tipo?: string;
}

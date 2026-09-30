import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export default class BuscarProfissionalTecnicoQueryDto extends PaginationOptionsDto {
  @ApiProperty({ description: 'Nome, CPF/CNPJ ou número de registro' })
  @IsString({ message: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_BUSCA })
  @MinLength(3, {
    message: ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_BUSCA,
  })
  declare q: string;
}

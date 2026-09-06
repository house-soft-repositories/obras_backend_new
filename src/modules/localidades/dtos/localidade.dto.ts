import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export default class LocalidadeDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString({ message: ErrorCodeConstants.LOCALIDADE_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.LOCALIDADE_INVALID_NAME })
  nome!: string;

  @ApiProperty()
  @IsString({ message: ErrorCodeConstants.LOCALIDADE_INVALID_UF })
  @Length(2, 2, { message: ErrorCodeConstants.LOCALIDADE_INVALID_UF })
  uf!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  codigoIbge!: string | null;

  @ApiPropertyOptional({ enum: TipoLocalidade, nullable: true })
  @IsOptional()
  @IsEnum(TipoLocalidade, {
    message: ErrorCodeConstants.LOCALIDADE_INVALID_TYPE,
  })
  tipo!: TipoLocalidade | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  municipio!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  observacoes!: string | null;

  @ApiProperty()
  @IsDateString()
  createdAt!: string;

  @ApiProperty()
  @IsDateString()
  updatedAt!: string;
}

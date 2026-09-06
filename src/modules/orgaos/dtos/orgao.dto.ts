import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export default class OrgaoDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID(undefined, { message: ErrorCodeConstants.ORGAO_INVALID_LOCALIDADE })
  localidadeId!: string;

  @ApiProperty()
  @IsString({ message: ErrorCodeConstants.ORGAO_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.ORGAO_INVALID_NAME })
  nome!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  sigla!: string | null;

  @ApiPropertyOptional({ enum: TipoOrgao, nullable: true })
  @IsOptional()
  @IsEnum(TipoOrgao, { message: ErrorCodeConstants.ORGAO_INVALID_TYPE })
  tipo!: TipoOrgao | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  responsavel!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail(undefined, { message: ErrorCodeConstants.ORGAO_INVALID_EMAIL })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  telefone!: string | null;

  @ApiProperty()
  @IsBoolean()
  ativo!: boolean;

  @ApiProperty()
  @IsDateString()
  createdAt!: string;

  @ApiProperty()
  @IsDateString()
  updatedAt!: string;
}

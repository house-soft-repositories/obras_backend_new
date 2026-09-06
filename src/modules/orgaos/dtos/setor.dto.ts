import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export default class SetorDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID(undefined, { message: ErrorCodeConstants.SETOR_INVALID_ORGAO })
  orgaoId!: string;

  @ApiProperty()
  @IsString({ message: ErrorCodeConstants.SETOR_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.SETOR_INVALID_NAME })
  nome!: string;

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

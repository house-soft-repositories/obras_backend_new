import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { TIPOS_PESSOA } from '@/modules/pessoas/domain/entities/pessoa.entity';
import PessoaDto from '@/modules/pessoas/dtos/pessoa.dto';
import { OmitType } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
export default class CreatePessoaDto extends OmitType(PessoaDto, [
  'id',
  'createdAt',
  'updatedAt',
  'ativo',
] as const) {
  @IsString({ message: ErrorCodeConstants.PESSOA_INVALID_TIPO })
  @IsNotEmpty({ message: ErrorCodeConstants.PESSOA_INVALID_TIPO })
  @IsIn(TIPOS_PESSOA, { message: ErrorCodeConstants.PESSOA_INVALID_TIPO })
  declare tipo: string;

  @IsString({ message: ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO })
  @IsNotEmpty({ message: ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO })
  declare documento: string;

  @IsString({ message: ErrorCodeConstants.PESSOA_INVALID_NOME })
  @IsNotEmpty({ message: ErrorCodeConstants.PESSOA_INVALID_NOME })
  @MinLength(2, { message: ErrorCodeConstants.PESSOA_INVALID_NOME })
  declare nome: string;
  @IsOptional() @IsString() declare nomeFantasia: string | null;
  @IsOptional() @IsString() declare rg: string | null;
  @IsOptional() @IsString() declare orgaoExpedidor: string | null;
  @IsOptional() @IsString() declare email: string | null;
  @IsOptional() @IsString() declare telefone: string | null;
  @IsOptional() @IsString() declare cep: string | null;
  @IsOptional() @IsString() declare logradouro: string | null;
  @IsOptional() @IsString() declare numero: string | null;
  @IsOptional() @IsString() declare complemento: string | null;
  @IsOptional() @IsString() declare bairro: string | null;
  @IsOptional() @IsString() declare cidade: string | null;
  @IsOptional() @IsString() declare uf: string | null;
}

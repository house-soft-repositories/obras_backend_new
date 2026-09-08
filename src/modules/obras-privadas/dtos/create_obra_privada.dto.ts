import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length, MinLength } from 'class-validator';
export default class CreateObraPrivadaDto {
  @IsString() @IsNotEmpty({message:ErrorCodeConstants.OBRA_PRIVADA_INVALID_DESCRICAO}) @MinLength(1,{message:ErrorCodeConstants.OBRA_PRIVADA_INVALID_DESCRICAO}) descricao:string;
  @IsOptional() @IsString() observacoes?:string;
  @IsUUID(undefined,{message:ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO}) @IsNotEmpty({message:ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO}) proprietarioPessoaId:string;
  @IsString() @IsNotEmpty({message:ErrorCodeConstants.OBRA_PRIVADA_INVALID_LOGRADOURO}) logradouro:string;
  @IsString() @Length(2,2,{message:ErrorCodeConstants.OBRA_PRIVADA_INVALID_UF}) uf:string;
  @IsOptional() @IsUUID() orgaoId?:string;
  @IsOptional() @IsString() inscricaoImobiliaria?:string;
  @IsOptional() @IsString() matriculaRgi?:string;
  @IsOptional() @IsString() cartorio?:string;
  @IsOptional() @IsString() cep?:string;
  @IsOptional() @IsString() numero?:string;
  @IsOptional() @IsString() complemento?:string;
  @IsOptional() @IsString() bairro?:string;
  @IsOptional() @IsUUID() localidadeId?:string;
  @IsOptional() @IsString() latitude?:string;
  @IsOptional() @IsString() longitude?:string;
  @IsOptional() @IsString() geoOrigem?:string;
  @IsOptional() @IsString() andamento?:string;
  @IsOptional() @IsString() habiteSe?:string;
  @IsOptional() @IsString() dataInicio?:string;
  @IsOptional() @IsString() dataPrevistaConclusao?:string;
}

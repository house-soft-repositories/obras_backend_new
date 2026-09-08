import PessoaDto from '@/modules/pessoas/dtos/pessoa.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
export default class CreatePessoaDto extends OmitType(PessoaDto,['id','createdAt','updatedAt','ativo'] as const){
  @IsString({message:ErrorCodeConstants.PESSOA_INVALID_TIPO}) @IsNotEmpty({message:ErrorCodeConstants.PESSOA_INVALID_TIPO}) declare tipo:string;
  @Transform(({value})=>typeof value==='string'?value.replace(/\D/g,''):value,{toClassOnly:true})
  @IsString({message:ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO}) @IsNotEmpty({message:ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO}) declare documento:string;
  @Transform(({value})=>typeof value==='string'?value.trim():value,{toClassOnly:true})
  @IsString({message:ErrorCodeConstants.PESSOA_INVALID_NOME}) @IsNotEmpty({message:ErrorCodeConstants.PESSOA_INVALID_NOME}) @MinLength(2,{message:ErrorCodeConstants.PESSOA_INVALID_NOME}) declare nome:string;
  @IsOptional() @IsString() declare nomeFantasia:string|null;
  @IsOptional() @IsString() declare rg:string|null;
  @IsOptional() @IsString() declare orgaoExpedidor:string|null;
  @IsOptional() @IsString() declare email:string|null;
  @IsOptional() @IsString() declare telefone:string|null;
  @IsOptional() @IsString() declare cep:string|null;
  @IsOptional() @IsString() declare logradouro:string|null;
  @IsOptional() @IsString() declare numero:string|null;
  @IsOptional() @IsString() declare complemento:string|null;
  @IsOptional() @IsString() declare bairro:string|null;
  @IsOptional() @IsString() declare cidade:string|null;
  @IsOptional() @IsString() declare uf:string|null;
}

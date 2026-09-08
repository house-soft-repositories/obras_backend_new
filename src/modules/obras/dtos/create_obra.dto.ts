import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
export class OrcamentoDto { @IsUUID() fonteId:string; @IsNumberString() valor:string; }
export default class CreateObraDto {
  @IsString({message:ErrorCodeConstants.OBRA_INVALID_NOME}) @IsNotEmpty({message:ErrorCodeConstants.OBRA_INVALID_NOME}) @MinLength(2,{message:ErrorCodeConstants.OBRA_INVALID_NOME}) nome:string;
  @IsString({message:ErrorCodeConstants.OBRA_INVALID_TIPO}) @IsNotEmpty({message:ErrorCodeConstants.OBRA_INVALID_TIPO}) tipo:string;
  @IsUUID(undefined,{message:ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL}) @IsNotEmpty({message:ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL}) responsavelUsuarioId:string;
  @IsUUID(undefined,{message:ErrorCodeConstants.OBRA_INVALID_ORGAO}) @IsNotEmpty({message:ErrorCodeConstants.OBRA_INVALID_ORGAO}) orgaoId:string;
  @IsOptional() @IsUUID() setorId?:string;
  @IsOptional() @IsUUID() localidadeId?:string;
  @IsOptional() @IsUUID() subclassificacaoId?:string;
  @IsOptional() @IsUUID() eixoId?:string;
  @IsOptional() @IsUUID() classificacaoId?:string;
  @IsOptional() @IsUUID() tipologiaId?:string;
  @IsOptional() @IsUUID() subtipologiaId?:string;
  @IsOptional() @IsString() descricao?:string;
  @IsOptional() seguirAutomatico?:boolean;
  @IsArray() @ArrayMinSize(1,{message:ErrorCodeConstants.OBRA_INVALID_ORCAMENTO}) @ValidateNested({each:true}) @Type(()=>OrcamentoDto) orcamentos:OrcamentoDto[];
}

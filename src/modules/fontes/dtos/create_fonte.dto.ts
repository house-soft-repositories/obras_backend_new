import FonteDto from '@/modules/fontes/dtos/fonte.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
export default class CreateFonteDto extends OmitType(FonteDto, ['id','createdAt','updatedAt','ativo'] as const) {
  @Transform(({value})=>typeof value==='string'?value.trim():value,{toClassOnly:true})
  @IsString({message:ErrorCodeConstants.FONTE_INVALID_NAME})
  @IsNotEmpty({message:ErrorCodeConstants.FONTE_INVALID_NAME})
  @MinLength(2,{message:ErrorCodeConstants.FONTE_INVALID_NAME})
  declare nome: string;
  @IsOptional() @IsString() declare descricao: string | null;
  @IsOptional() @IsString() declare codigo: string | null;
  @IsOptional() @IsString() declare tipo: string | null;
  @IsOptional() @IsString() declare valorPrevisto: string | null;
  @IsOptional() @IsString() declare vigencia: string | null;
}

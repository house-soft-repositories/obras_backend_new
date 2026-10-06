import { ResultadoHabiteSe } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { ArquivoUploadItemDto } from '@/modules/obras-privadas/dtos/obra_privada_arquivo.dto';
import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
export class CreateHabiteSeDto {
  @IsString() @IsNotEmpty() numero: string;
  @IsOptional() @IsString() dataEmissao?: string | null;
  @IsOptional() @IsBoolean() parcial?: boolean;
  @IsOptional() @IsString() descricaoParcial?: string | null;
  @IsOptional() @IsString() dataVistoria?: string | null;
  @IsOptional() @IsUUID() vistoriadorUsuarioId?: string | null;
  @IsOptional() @IsUUID() fiscalizacaoId?: string | null;
  @IsEnum(ResultadoHabiteSe) resultado: ResultadoHabiteSe;
  @IsOptional() @IsString() areaConstruidaExecutadaM2?: string | null;
  @IsOptional() @IsBoolean() divergenciaProjeto?: boolean;
  @IsOptional() @IsString() divergenciaDescricao?: string | null;
  @IsOptional() @IsString() parecer?: string | null;
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ArquivoUploadItemDto)
  arquivo?: ArquivoUploadItemDto;
}
export class UpdateHabiteSeDto extends PartialType(
  OmitType(CreateHabiteSeDto, ['arquivo'] as const),
) {}

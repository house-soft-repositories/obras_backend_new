import { ResultadoHabiteSe } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
  @IsOptional() @IsUUID() arquivoId?: string | null;
}
export class UpdateHabiteSeDto extends PartialType(CreateHabiteSeDto) {}

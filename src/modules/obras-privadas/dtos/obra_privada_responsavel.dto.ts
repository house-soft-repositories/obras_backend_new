import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateObraPrivadaResponsavelDto {
  @IsUUID() profissionalTecnicoId: string;
  @IsEnum(PapelResponsavelTecnico) papel: PapelResponsavelTecnico;
  @IsEnum(TipoDocumentoResponsabilidade)
  tipoDocumento: TipoDocumentoResponsabilidade;
  @IsString() @IsNotEmpty() numeroDocumento: string;
  @IsOptional() @IsDateString() dataDocumento?: string | null;
  @IsOptional() @IsUUID() arquivoId?: string | null;
  @IsOptional() @IsDateString() dataInicio?: string | null;
  @IsOptional() @IsDateString() dataBaixa?: string | null;
  @IsOptional() @IsString() @IsNotEmpty() motivoBaixa?: string | null;
}

export class UpdateObraPrivadaResponsavelDto extends PartialType(
  CreateObraPrivadaResponsavelDto,
) {}

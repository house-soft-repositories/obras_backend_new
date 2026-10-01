import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
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
  @IsOptional() @IsString() dataDocumento?: string | null;
  @IsOptional() @IsUUID() arquivoId?: string | null;
  @IsOptional() @IsString() dataInicio?: string | null;
  @IsOptional() @IsString() dataBaixa?: string | null;
  @IsOptional() @IsString() motivoBaixa?: string | null;
}

export class UpdateObraPrivadaResponsavelDto extends PartialType(
  CreateObraPrivadaResponsavelDto,
) {}

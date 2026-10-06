import {
  MotivoAlvara,
  SituacaoRegistroAlvara,
  TipoAlvara,
  UsoEdificacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { ArquivoUploadItemDto } from '@/modules/obras-privadas/dtos/obra_privada_arquivo.dto';
import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateAlvaraDto {
  @IsOptional() @IsString() numero?: string | null;
  @IsInt() @Min(1900) ano: number;
  @IsEnum(TipoAlvara) tipo: TipoAlvara;
  @IsOptional() @IsEnum(MotivoAlvara) motivo?: MotivoAlvara;
  @IsOptional()
  @IsEnum(SituacaoRegistroAlvara)
  situacao?: SituacaoRegistroAlvara;
  @IsOptional() @IsString() dataEmissao?: string | null;
  @IsOptional() @IsString() dataValidade?: string | null;
  @IsOptional() @IsUUID() alvaraAnteriorId?: string | null;
  @IsOptional() @IsString() areaTerrenoM2?: string | null;
  @IsOptional() @IsString() areaConstruidaAprovadaM2?: string | null;
  @IsOptional() @IsEnum(UsoEdificacao) uso?: UsoEdificacao | null;
  @IsOptional() @IsInt() pavimentos?: number | null;
  @IsOptional() @IsInt() unidades?: number | null;
  @IsOptional() @IsString() processoAdministrativo?: string | null;
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ArquivoUploadItemDto)
  arquivo?: ArquivoUploadItemDto;
  @IsOptional() @IsString() observacoes?: string | null;
}

export class UpdateAlvaraDto extends PartialType(
  OmitType(CreateAlvaraDto, ['arquivo'] as const),
) {}

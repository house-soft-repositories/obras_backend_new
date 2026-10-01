import {
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
export class CreateAutoInfracaoDto {
  @IsOptional() @IsUUID() fiscalizacaoId?: string | null;
  @IsEnum(TipoAutoInfracao) tipo: TipoAutoInfracao;
  @IsString() @IsNotEmpty() dataEmissao: string;
  @IsOptional() @IsInt() prazoDias?: number | null;
  @IsOptional() @IsString() baseLegal?: string | null;
  @IsString() @IsNotEmpty() descricao: string;
  @IsOptional() @IsString() valorMulta?: string | null;
  @IsOptional() @IsEnum(SituacaoAutoInfracao) situacao?: SituacaoAutoInfracao;
  @IsOptional() @IsString() dataEncerramento?: string | null;
  @IsOptional() @IsString() observacoes?: string | null;
}
export class UpdateAutoInfracaoDto extends PartialType(CreateAutoInfracaoDto) {}

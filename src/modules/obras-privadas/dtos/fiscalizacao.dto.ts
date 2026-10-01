import {
  EtapaObraPrivada,
  LocalEntulho,
  ResultadoFiscalizacao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFiscalizacaoDto {
  @IsEnum(TipoFiscalizacao) tipo: TipoFiscalizacao;
  @IsString() @IsNotEmpty() dataFiscalizacao: string;
  @IsEnum(ResultadoFiscalizacao) resultado: ResultadoFiscalizacao;
  @IsOptional()
  @IsEnum(EtapaObraPrivada)
  etapaConstatada?: EtapaObraPrivada | null;
  @IsOptional() @IsString() constatacoes?: string | null;
  @IsOptional() @IsString() providencias?: string | null;
  @IsOptional() @IsString() latitude?: string | null;
  @IsOptional() @IsString() longitude?: string | null;
  @IsOptional() @IsBoolean() entulhoHaIrregularidade?: boolean | null;
  @IsOptional() @IsString() entulhoVolumeEstimadoM3?: string | null;
  @IsOptional() @IsEnum(LocalEntulho) entulhoLocal?: LocalEntulho | null;
  @IsOptional() @IsBoolean() entulhoPossuiCacamba?: boolean | null;
  @IsOptional() @IsBoolean() entulhoPossuiPgrcc?: boolean | null;
  @IsOptional() @IsString() entulhoDestinacao?: string | null;
}

export class UpdateFiscalizacaoDto extends PartialType(CreateFiscalizacaoDto) {}

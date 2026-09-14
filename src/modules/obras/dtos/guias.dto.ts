import { IsEnum, IsNumberString, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { SituacaoLicenca } from '@/modules/obras/domain/enums/situacao_licenca.enum';
import { SituacaoTitularidade } from '@/modules/obras/domain/enums/situacao_titularidade.enum';
import { TipoRecebimento } from '@/modules/obras/domain/enums/tipo_recebimento.enum';

export class CriarLocalizacaoDto {
  @IsString() localidade!: string;
  @IsString() @Length(2, 2) uf!: string;
  @IsOptional() @IsNumberString() latitude?: string;
  @IsOptional() @IsNumberString() longitude?: string;
}

export class CriarOrcamentoDto {
  @IsUUID() fonteId!: string;
  @IsNumberString() valor!: string;
}

export class SalvarTitularidadeDto {
  @IsEnum(SituacaoTitularidade) situacao!: SituacaoTitularidade;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class SalvarLicencaDto {
  @IsEnum(SituacaoLicenca) situacao!: SituacaoLicenca;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() numero?: string;
  @IsOptional() @IsString() validade?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class AtualizarLicencaDto {
  @IsOptional() @IsEnum(SituacaoLicenca) situacao?: SituacaoLicenca;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() numero?: string;
  @IsOptional() @IsString() validade?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class SalvarRecebimentoDto {
  @IsEnum(TipoRecebimento) tipo!: TipoRecebimento;
  @IsOptional() @IsString() data?: string;
  @IsOptional() @IsString() dataPrevista?: string;
}

export class AtualizarRecebimentoDto {
  @IsOptional() @IsEnum(TipoRecebimento) tipo?: TipoRecebimento;
  @IsOptional() @IsString() data?: string;
  @IsOptional() @IsString() dataPrevista?: string;
}

import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import {
  AndamentoObraPrivada,
  OrigemGeolocalizacao,
  SituacaoAlvara,
  SituacaoHabiteSe,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export default class UpdateObraPrivadaDto {
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() observacoes?: string | null;
  @IsOptional() @IsUUID() proprietarioPessoaId?: string;
  @IsOptional() @IsUUID() orgaoId?: string | null;
  @IsOptional() @IsString() inscricaoImobiliaria?: string | null;
  @IsOptional() @IsString() matriculaRgi?: string | null;
  @IsOptional() @IsString() cartorio?: string | null;
  @IsOptional() @IsString() cep?: string | null;
  @IsOptional() @IsString() logradouro?: string;
  @IsOptional() @IsString() numero?: string | null;
  @IsOptional() @IsString() complemento?: string | null;
  @IsOptional() @IsString() bairro?: string | null;
  @IsOptional() @IsUUID() localidadeId?: string | null;
  @IsOptional() @IsString() @Length(2, 2) uf?: string;
  @IsOptional() @IsNumberString() latitude?: string | null;
  @IsOptional() @IsNumberString() longitude?: string | null;
  @IsOptional() @IsEnum(OrigemGeolocalizacao) geoOrigem?: OrigemGeolocalizacao;
  @IsOptional() @IsEnum(SituacaoAlvara) situacaoAlvara?: SituacaoAlvara;
  @IsOptional() @IsEnum(AndamentoObraPrivada) andamento?: AndamentoObraPrivada;
  @IsOptional() @IsEnum(SituacaoHabiteSe) habiteSe?: SituacaoHabiteSe;
  @IsOptional() @IsDateString() dataInicio?: string | null;
  @IsOptional() @IsDateString() dataPrevistaConclusao?: string | null;
}

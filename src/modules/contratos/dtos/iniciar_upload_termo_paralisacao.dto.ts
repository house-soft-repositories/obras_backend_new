import { IsMimeType, IsString, MinLength } from 'class-validator';

export default class IniciarUploadTermoParalisacaoDto {
  @IsString()
  @MinLength(1)
  nomeOriginal!: string;

  @IsMimeType()
  mimeType!: string;
}

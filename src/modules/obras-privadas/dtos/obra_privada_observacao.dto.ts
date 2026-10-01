import { IsNotEmpty, IsString } from 'class-validator';

export class CreateObraPrivadaObservacaoDto {
  @IsString()
  @IsNotEmpty()
  texto: string;
}

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CriarObservacaoDto {
  @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(2000) texto!: string;
}

export class AtualizarObservacaoDto {
  @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(2000) texto!: string;
}

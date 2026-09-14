import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CriarCadastroDto {
  @IsString() @MinLength(2) nome!: string;
}

export class AtualizarCadastroDto {
  @IsOptional() @IsString() @MinLength(2) nome?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

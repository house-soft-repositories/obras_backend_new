import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AddMembroDto {
  @IsUUID() usuarioId!: string;
  @IsOptional() @IsEnum(['RESPONSAVEL', 'CORRESPONSAVEL']) tipo?: string;
}

export class SeguirdorDto {
  @IsUUID() usuarioId!: string;
}

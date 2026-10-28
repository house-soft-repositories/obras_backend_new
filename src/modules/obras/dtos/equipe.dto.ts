import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ObraResponsavelTipo } from '@/modules/obras/domain/enums/obra_responsavel_tipo.enum';

export class AddMembroDto {
  @IsUUID() usuarioId!: string;
  @IsOptional()
  @IsEnum([ObraResponsavelTipo.RESPONSAVEL])
  tipo?: ObraResponsavelTipo.RESPONSAVEL;
}

export class SeguirdorDto {
  @IsUUID() usuarioId!: string;
}

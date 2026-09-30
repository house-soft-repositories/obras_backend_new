import { CONSELHOS_PROFISSIONAIS } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import type { ConselhoProfissional } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

export default class CreateProfissionalTecnicoDto {
  @ApiProperty()
  @IsUUID()
  declare pessoaId: string;

  @ApiProperty({ enum: CONSELHOS_PROFISSIONAIS })
  @IsIn(CONSELHOS_PROFISSIONAIS)
  declare conselho: ConselhoProfissional;

  @ApiProperty()
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    {
      toClassOnly: true,
    },
  )
  @IsString()
  @MinLength(1)
  declare numeroRegistro: string;

  @ApiPropertyOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
    { toClassOnly: true },
  )
  @IsOptional()
  @IsString()
  @Length(2, 2)
  declare ufRegistro?: string | null;

  @ApiPropertyOptional({ description: 'Ex.: Eng. Civil' })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    {
      toClassOnly: true,
    },
  )
  @IsOptional()
  @IsString()
  declare titulo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  declare ativo?: boolean;
}

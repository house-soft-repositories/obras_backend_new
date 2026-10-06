import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';

export class MedicaoFonteDto {
  @IsUUID()
  fonteId!: string;

  @Transform(
    ({ value }: { value: unknown }) => {
      if (typeof value === 'number') return value;
      if (typeof value !== 'string') return value;
      const normalized = value.trim();
      if (!/^\d+(\.\d+)?$/.test(normalized)) return value;
      return Number(normalized);
    },
    { toClassOnly: true },
  )
  @IsNumber()
  @Min(0)
  valor!: number;
}

export class CreateMedicaoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numero!: number;

  @IsEnum(TipoMedicao)
  tipo!: TipoMedicao;

  @IsDateString()
  dataMedicao!: string;

  @IsUUID()
  orgaoId!: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MedicaoFonteDto)
  fontes!: MedicaoFonteDto[];
}

export class UpdateMedicaoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  numero?: number;

  @IsOptional()
  @IsEnum(TipoMedicao)
  tipo?: TipoMedicao;

  @IsOptional()
  @IsDateString()
  dataMedicao?: string;

  @IsOptional()
  @IsUUID()
  orgaoId?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MedicaoFonteDto)
  fontes?: MedicaoFonteDto[];
}

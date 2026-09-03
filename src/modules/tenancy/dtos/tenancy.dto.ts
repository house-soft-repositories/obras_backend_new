import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export default class TenancyDto {
  @IsUUID()
  id: string;

  @Transform(({ value }: { value: string }) => value.trim(), {
    toClassOnly: true,
  })
  @IsString()
  name: string;

  @Transform(({ value }: { value: string }) => value.trim().toLowerCase(), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @IsOptional()
  @IsString()
  cnpj?: string | null;

  @IsBoolean()
  active: boolean;

  @IsString()
  schemaName: string;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

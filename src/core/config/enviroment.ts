import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  IsNumber,
  IsString
} from 'class-validator';

export default class EnvironmentVariables {
  @IsEnum(['DEV', 'TST', 'PRD'])
  @IsString()
  NODE_ENV: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string;

  @IsNumber()
  @IsNotEmpty()
  DATABASE_PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string;

  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 10 : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  DATABASE_MAX_POOL_CONNECTIONS: number;

  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(10)
  @Max(14)
  SALT: number;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  PORT: number;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 'http://minio:9000' : value,
  )
  @IsString()
  @IsNotEmpty()
  STORAGE_ENDPOINT?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 'auto' : value,
  )
  @IsString()
  @IsNotEmpty()
  STORAGE_REGION?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 'obras-dev' : value,
  )
  @IsString()
  @IsNotEmpty()
  STORAGE_BUCKET?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 'minioadmin' : value,
  )
  @IsString()
  @IsNotEmpty()
  STORAGE_ACCESS_KEY?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 'minioadmin' : value,
  )
  @IsString()
  @IsNotEmpty()
  STORAGE_SECRET_KEY?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? true : value !== 'false',
  )
  @IsBoolean()
  STORAGE_FORCE_PATH_STYLE?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? 900 : parseInt(value, 10),
  )
  @IsInt()
  @Min(60)
  STORAGE_PRESIGN_EXPIRES_SECONDS?: number;
}

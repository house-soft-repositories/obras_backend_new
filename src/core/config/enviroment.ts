import { Transform } from 'class-transformer';
import {
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
}

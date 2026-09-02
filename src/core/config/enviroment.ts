import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
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

  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsNotEmpty()
  @IsNumber()
  SALT: number;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  PORT: number;
}

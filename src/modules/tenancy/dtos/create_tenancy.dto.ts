import { OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import TenancyDto from '@/modules/tenancy/dtos/tenancy.dto';

export default class CreateTenancyDto extends OmitType(TenancyDto, [
  'id',
  'active',
  'schemaName',
  'createdAt',
  'updatedAt',
] as const) {
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/)
  declare cnpj?: string;
}

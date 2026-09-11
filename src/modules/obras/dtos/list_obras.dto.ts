import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '@/core/pagination/dto/page_options.dto';

export default class ListObrasQueryDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsUUID()
  orgaoId?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

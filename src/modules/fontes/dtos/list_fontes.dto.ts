import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export default class ListFontesDto extends PaginationOptionsDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  }, { toClassOnly: true })
  @IsBoolean()
  readonly ativo?: boolean;
}

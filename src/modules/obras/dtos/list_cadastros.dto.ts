import { PageOptionsDto } from '@/core/pagination/dto/page_options.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export default class ListCadastrosDto extends PageOptionsDto {
  @Transform(({ value }) => value === true || value === 'true', {
    toClassOnly: true,
  })
  @IsBoolean()
  @IsOptional()
  readonly apenasAtivos = false;
}

import CreateFonteDto from '@/modules/fontes/dtos/create_fonte.dto';
import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export default class UpdateFonteDto extends PartialType(CreateFonteDto) {
  @IsOptional()
  @IsBoolean()
  declare ativo?: boolean;
}

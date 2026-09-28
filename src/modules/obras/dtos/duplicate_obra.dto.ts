import { IsBoolean, IsOptional } from 'class-validator';

export default class DuplicateObraDto {
  @IsOptional()
  @IsBoolean()
  copiarArquivos?: boolean;
}

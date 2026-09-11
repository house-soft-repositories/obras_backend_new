import { IsNotEmpty, IsString } from 'class-validator';

export class AplicarTagsDto {
  @IsString() @IsNotEmpty() tags!: string;
}

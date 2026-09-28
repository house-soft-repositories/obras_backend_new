import PastaDto from '@/modules/documentos/dtos/pasta.dto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export default class CreatePastaDto extends PickType(PastaDto, [
  'pastaPaiId',
  'nome',
] as const) {
  @IsUUID()
  declare pastaPaiId: string;
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value), {
    toClassOnly: true,
  })
  @IsString({ message: ErrorCodeConstants.PASTA_INVALID_NAME })
  @IsNotEmpty({ message: ErrorCodeConstants.PASTA_INVALID_NAME })
  @MinLength(1, { message: ErrorCodeConstants.PASTA_INVALID_NAME })
  @MaxLength(120, { message: ErrorCodeConstants.PASTA_INVALID_NAME })
  declare nome: string;
}

import CreateLocalidadeDto from '@/modules/localidades/dtos/create_localidade.dto';
import { PartialType } from '@nestjs/swagger';

export default class UpdateLocalidadeDto extends PartialType(
  CreateLocalidadeDto,
) {}

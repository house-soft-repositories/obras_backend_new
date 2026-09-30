import CreateProfissionalTecnicoDto from '@/modules/pessoas/dtos/create_profissional_tecnico.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export default class UpdateProfissionalTecnicoDto extends PartialType(
  OmitType(CreateProfissionalTecnicoDto, ['pessoaId'] as const),
) {}

import CreatePessoaDto from '@/modules/pessoas/dtos/create_pessoa.dto';
import { PartialType } from '@nestjs/swagger';
export default class UpdatePessoaDto extends PartialType(CreatePessoaDto) {}

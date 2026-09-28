import { IsUUID } from 'class-validator';

export default class MoverArquivoDto {
  @IsUUID()
  pastaId: string;
}

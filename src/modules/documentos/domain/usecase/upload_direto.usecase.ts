import type UseCase from '@/core/types/use_case';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

export interface UploadDiretoParam {
  pastaId: string;
  files: BaseFileInterface[];
  usuarioId: string;
}

type IUploadDiretoUseCase = UseCase<UploadDiretoParam, ArquivoEntity[]>;
export default IUploadDiretoUseCase;

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IContarArquivosUseCase, {
  ContarArquivosParam,
} from '@/modules/documentos/domain/usecase/contar_arquivos.usecase';

export default class ContarArquivosService implements IContarArquivosUseCase {
  constructor(private readonly arquivos: IArquivoRepository) {}

  async execute(param: ContarArquivosParam): AsyncResult<AppException, number> {
    return this.arquivos.countByObraId(param.obraId);
  }
}

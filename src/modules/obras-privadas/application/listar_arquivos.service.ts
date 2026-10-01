import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import IListarArquivosUseCase, {
  ListarArquivosParam,
} from '@/modules/obras-privadas/domain/usecase/listar_arquivos.usecase';

export default class ListarArquivosService implements IListarArquivosUseCase {
  constructor(private readonly arquivos: IObraPrivadaArquivoRepository) {}

  async execute(
    param: ListarArquivosParam,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity[]> {
    return this.arquivos.list(param);
  }
}

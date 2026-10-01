import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import { ListArquivosQuery } from '@/modules/obras-privadas/infra/query/list_arquivos.query';

export default interface IObraPrivadaArquivoRepository {
  save(
    entity: ObraPrivadaArquivoEntity,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity>;
  findById(
    id: string,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity | null>;
  list(
    query: ListArquivosQuery,
  ): AsyncResult<AppException, ObraPrivadaArquivoEntity[]>;
  delete(id: string): AsyncResult<AppException, Unit>;
}

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';

export default interface IArquivoRepository {
  save(entity: ArquivoEntity): AsyncResult<AppException, ArquivoEntity>;
  findById(id: string): AsyncResult<AppException, ArquivoEntity | null>;
  findByPastaId(
    pastaId: string,
    take: number,
    skip: number,
    order: 'ASC' | 'DESC',
  ): AsyncResult<AppException, ArquivoEntity[]>;
  countByPastaId(pastaId: string): AsyncResult<AppException, number>;
  findByObraId(obraId: string): AsyncResult<AppException, ArquivoEntity[]>;
  countByObraId(obraId: string): AsyncResult<AppException, number>;
  deleteById(id: string): AsyncResult<AppException, Unit>;
}

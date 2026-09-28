import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';

export default interface IPastaRepository {
  save(entity: PastaEntity): AsyncResult<AppException, PastaEntity>;
  findById(id: string): AsyncResult<AppException, PastaEntity | null>;
  findRootByObraId(
    obraId: string,
  ): AsyncResult<AppException, PastaEntity | null>;
  findChildren(pastaId: string): AsyncResult<AppException, PastaEntity[]>;
  findByObraId(obraId: string): AsyncResult<AppException, PastaEntity[]>;
  findSiblingByName(
    obraId: string,
    pastaPaiId: string | null,
    nome: string,
  ): AsyncResult<AppException, PastaEntity | null>;
  deleteById(id: string): AsyncResult<AppException, Unit>;
}

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import TagEntity from '@/modules/obras/domain/entities/tag.entity';

export default interface ITagRepository {
  findByNome(nome: string): AsyncResult<AppException, TagEntity | null>;
  findById(id: string): AsyncResult<AppException, TagEntity | null>;
  save(entity: TagEntity): AsyncResult<AppException, TagEntity>;
  listByObra(obraId: string): AsyncResult<AppException, TagEntity[]>;
  attach(obraId: string, tagId: string): AsyncResult<AppException, void>;
  detach(obraId: string, tagId: string): AsyncResult<AppException, void>;
}

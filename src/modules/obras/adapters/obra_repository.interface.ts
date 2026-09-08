import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
export default interface IObraRepository {
  save(e:ObraEntity):AsyncResult<AppException,ObraEntity>;
  findLastCodigo(year:number):AsyncResult<AppException,string|null>;
  findById(id:string):AsyncResult<AppException,ObraEntity|null>;
}

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
export default interface IObraPrivadaRepository {
  save(e:ObraPrivadaEntity):AsyncResult<AppException,ObraPrivadaEntity>;
  findLastCodigo(year:number):AsyncResult<AppException,string|null>;
  findById(id:string):AsyncResult<AppException,ObraPrivadaEntity|null>;
}

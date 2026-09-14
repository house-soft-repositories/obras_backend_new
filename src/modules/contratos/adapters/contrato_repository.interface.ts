import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
export default interface IContratoRepository {
  save(e: ContratoEntity): AsyncResult<AppException, ContratoEntity>;
  findById(id: string): AsyncResult<AppException, ContratoEntity | null>;
  findPage(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<ContratoEntity>>;
  findByObraSingle(
    obraId: string,
  ): AsyncResult<AppException, ContratoEntity | null>;
  delete(id: string): AsyncResult<AppException, void>;
}

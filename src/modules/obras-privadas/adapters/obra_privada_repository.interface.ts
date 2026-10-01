import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import type { Unit } from '@/core/types/unit';
import ObraPrivadaEntity, {
  ObraPrivadaUpdate,
} from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import { LicenciamentoListReadModel } from '@/modules/obras-privadas/infra/read-models/licenciamento_list_read_model';
import { ObraPrivadaListReadModel } from '@/modules/obras-privadas/infra/read-models/obra_privada_list_read_model';
import { ListLicenciamentoQuery } from '@/modules/obras-privadas/infra/query/list_licenciamento.query';
import { ListObrasQuery } from '@/modules/obras-privadas/infra/query/list_obras.query';

export default interface IObraPrivadaRepository {
  save(e: ObraPrivadaEntity): AsyncResult<AppException, ObraPrivadaEntity>;
  findLastCodigo(year: number): AsyncResult<AppException, string | null>;
  findById(id: string): AsyncResult<AppException, ObraPrivadaEntity | null>;
  findNoMesmoImovel(id: string): AsyncResult<AppException, ObraPrivadaEntity[]>;
  update(
    id: string,
    props: ObraPrivadaUpdate,
  ): AsyncResult<AppException, ObraPrivadaEntity | null>;
  softDelete(id: string): AsyncResult<AppException, Unit>;
  listObras(
    pageOptions: PageOptionsEntity,
    query: ListObrasQuery,
  ): AsyncResult<AppException, PageEntity<ObraPrivadaListReadModel>>;
  listLicenciamento(
    pageOptions: PageOptionsEntity,
    query: ListLicenciamentoQuery,
  ): AsyncResult<AppException, PageEntity<LicenciamentoListReadModel>>;
}

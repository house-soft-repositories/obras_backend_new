import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import type { LiquidacaoComFonte } from '@/modules/obras/domain/usecase/liquidacoes.usecase';

export default interface ILiquidacaoRepository {
  save(entity: LiquidacaoEntity): AsyncResult<AppException, LiquidacaoEntity>;
  findById(id: string): AsyncResult<AppException, LiquidacaoEntity | null>;
  findByIdWithFonte(id: string): AsyncResult<AppException, LiquidacaoComFonte | null>;
  listByObra(obraId: string): AsyncResult<AppException, LiquidacaoEntity[]>;
  listByObraWithFonte(obraId: string): AsyncResult<AppException, LiquidacaoComFonte[]>;
  sumPago(liquidacaoId: string, ignoreId?: string): AsyncResult<AppException, number>;
  delete(id: string): AsyncResult<AppException, void>;
}

import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpenhoRepository from '@/modules/obras/adapters/empenho_repository.interface';
import ILiquidacaoRepository from '@/modules/obras/adapters/liquidacao_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IPagamentoRepository from '@/modules/obras/adapters/pagamento_repository.interface';
import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import type { CreatePagamentoParam, PagamentoResult, UpdatePagamentoParam } from '@/modules/obras/domain/usecase/pagamentos.usecase';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

export default class PagamentosService {
  constructor(
    private readonly repo: IPagamentoRepository,
    private readonly empenhos: IEmpenhoRepository,
    private readonly liquidacoes: ILiquidacaoRepository,
    private readonly obras: IObraRepository,
    private readonly fontes: IFonteRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private async ensureFonteAtiva(fonteId: string): AsyncResult<AppException, void> {
    const fonte = await this.fontes.findById(fonteId);
    if (fonte.isLeft()) return left(fonte.value);
    if (!fonte.value)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_NOT_FOUND, statusCode: 404 }));
    if (!fonte.value.ativo)
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.FONTE_INATIVA, statusCode: 422 }));
    return right(undefined);
  }

  private async checkMedicao(obraId: string): AsyncResult<AppException, string | undefined> {
    try {
      const obra = await this.obras.findById(obraId);
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query<Record<string, unknown>[]>(`SELECT 1 FROM "${s}"."medicao" WHERE obra_id=$1 LIMIT 1`, [obraId]);
      if (rows.length > 0) return right(undefined);
      if (obra.value.vincularPagamentoPercentual)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_SEM_MEDICAO, statusCode: 422 }));
      return right('Atencao: nenhuma medicao cadastrada para a obra.');
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async create(param: CreatePagamentoParam): AsyncResult<AppException, PagamentoResult> {
    try {
      const ctx = this.tc.require();
      const okFonte = await this.ensureFonteAtiva(param.fonteId);
      if (okFonte.isLeft()) return left(okFonte.value);
      const medicao = await this.checkMedicao(param.obraId);
      if (medicao.isLeft()) return left(medicao.value);
      const empenho = await this.empenhos.findById(param.empenhoId);
      if (empenho.isLeft()) return left(empenho.value);
      if (!empenho.value || empenho.value.obraId !== param.obraId)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.EMPENHO_NOT_FOUND, statusCode: 422 }));
      const liquidacao = await this.liquidacoes.findById(param.liquidacaoId);
      if (liquidacao.isLeft()) return left(liquidacao.value);
      if (!liquidacao.value || liquidacao.value.empenhoId !== param.empenhoId)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_NOT_FOUND, statusCode: 422 }));
      const jaPago = await this.liquidacoes.sumPago(param.liquidacaoId);
      if (jaPago.isLeft()) return left(jaPago.value);
      if (jaPago.value + param.valor > liquidacao.value.valor + 1e-9)
        return left(
          new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_EXCEDE_LIQUIDACAO, statusCode: 422 }),
        );
      const entity = PagamentoEntity.create({ ...param, tenantId: ctx.tenantId });
      const saved = await this.repo.save(entity);
      if (saved.isLeft()) return left(saved.value);
      return right({ pagamento: saved.value, alerta: medicao.value });
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async list(obraId: string): AsyncResult<AppException, PagamentoEntity[]> {
    return this.repo.listByObra(obraId);
  }

  async get(obraId: string, id: string): AsyncResult<AppException, PagamentoEntity> {
    try {
      const found = await this.repo.findById(id);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_NOT_FOUND, statusCode: 404 }));
      const empenho = await this.empenhos.findById(found.value.empenhoId);
      if (empenho.isLeft()) return left(empenho.value);
      if (!empenho.value || empenho.value.obraId !== obraId)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_NOT_FOUND, statusCode: 404 }));
      return right(found.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async update(param: UpdatePagamentoParam): AsyncResult<AppException, PagamentoEntity> {
    try {
      const current = await this.get(param.obraId, param.id);
      if (current.isLeft()) return left(current.value);
      if (param.patch.fonteId !== undefined) {
        const okFonte = await this.ensureFonteAtiva(param.patch.fonteId);
        if (okFonte.isLeft()) return left(okFonte.value);
      }
      if (param.patch.valor !== undefined) {
        const liquidacao = await this.liquidacoes.findById(current.value.liquidacaoId);
        if (liquidacao.isLeft()) return left(liquidacao.value);
        if (!liquidacao.value)
          return left(new ObraRepositoryException({ code: ErrorCodeConstants.LIQUIDACAO_NOT_FOUND, statusCode: 422 }));
        const jaPago = await this.liquidacoes.sumPago(current.value.liquidacaoId, param.id);
        if (jaPago.isLeft()) return left(jaPago.value);
        if (jaPago.value + param.patch.valor > liquidacao.value.valor + 1e-9)
          return left(
            new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_EXCEDE_LIQUIDACAO, statusCode: 422 }),
          );
      }
      current.value.update(param.patch);
      return this.repo.save(current.value);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.PAGAMENTO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }

  async remove(obraId: string, id: string): AsyncResult<AppException, void> {
    const current = await this.get(obraId, id);
    if (current.isLeft()) return left(current.value);
    return this.repo.delete(id);
  }
}

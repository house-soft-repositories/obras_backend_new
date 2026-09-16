import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import type { IndicadorFinanceiro, VisaoFisicoFinanceira } from '@/modules/obras/domain/usecase/visao_fisico_financeira.usecase';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

export default class VisaoFisicoFinanceiraService {
  constructor(
    private readonly obras: IObraRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  private indicador(valor: number, total: number): IndicadorFinanceiro {
    return {
      valor: valor.toFixed(2),
      percentual: total > 0 ? Number(((valor / total) * 100).toFixed(2)) : 0,
    };
  }

  async get(obraId: string): AsyncResult<AppException, VisaoFisicoFinanceira> {
    try {
      const obra = await this.obras.findById(obraId);
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value)
        return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_NOT_FOUND, statusCode: 404 }));
      const s = this.tc.require().schemaName;
      const [[c], [a], [m], [e], [l], [p]] = await Promise.all([
        this.ds.query<{ sum: string }[]>(
          `SELECT COALESCE(SUM(cf.valor), 0) AS sum FROM "${s}"."contrato" c JOIN "${s}"."contrato_fonte" cf ON cf.contrato_id = c.id WHERE c.obra_id=$1`,
          [obraId],
        ),
        this.ds.query<{ sum: string }[]>(
          `SELECT COALESCE(SUM(af.valor), 0) AS sum FROM "${s}"."aditivo" ad JOIN "${s}"."aditivo_fonte" af ON af.aditivo_id = ad.id JOIN "${s}"."contrato" c ON c.id = ad.contrato_id WHERE c.obra_id=$1`,
          [obraId],
        ),
        this.ds.query<{ sum: string }[]>(
          `SELECT COALESCE(SUM(mf.valor), 0) AS sum FROM "${s}"."medicao" me JOIN "${s}"."medicao_fonte" mf ON mf.medicao_id = me.id WHERE me.obra_id=$1`,
          [obraId],
        ),
        this.ds.query<{ sum: string }[]>(`SELECT COALESCE(SUM(valor), 0) AS sum FROM "${s}"."empenho" WHERE obra_id=$1`, [obraId]),
        this.ds.query<{ sum: string }[]>(
          `SELECT COALESCE(SUM(l.valor), 0) AS sum FROM "${s}"."liquidacao" l JOIN "${s}"."empenho" e ON e.id = l.empenho_id WHERE e.obra_id=$1`,
          [obraId],
        ),
        this.ds.query<{ sum: string }[]>(
          `SELECT COALESCE(SUM(p.valor), 0) AS sum FROM "${s}"."pagamento" p JOIN "${s}"."empenho" e ON e.id = p.empenho_id WHERE e.obra_id=$1`,
          [obraId],
        ),
      ]);
      const contratadoInicial = Number(c?.sum ?? 0);
      const aditivadoTotal = Number(a?.sum ?? 0);
      const totalContratado = contratadoInicial + aditivadoTotal;
      const medidoTotal = Number(m?.sum ?? 0);
      const empenhado = Number(e?.sum ?? 0);
      const liquidado = Number(l?.sum ?? 0);
      const pago = Number(p?.sum ?? 0);
      return right({
        obraId,
        contratadoInicial: this.indicador(contratadoInicial, totalContratado),
        aditivadoTotal: this.indicador(aditivadoTotal, totalContratado),
        totalContratado: this.indicador(totalContratado, totalContratado),
        medidoTotal: this.indicador(medidoTotal, totalContratado),
        empenhadoTotal: this.indicador(empenhado, totalContratado),
        liquidadoTotal: this.indicador(liquidado, totalContratado),
        pagoTotal: this.indicador(pago, totalContratado),
      });
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ObraRepositoryException({ code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
}

import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import { calcularPrazoFinalExecucao } from '@/modules/contratos/domain/calculo_prazo_execucao';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoServiceException from '@/modules/contratos/exceptions/contrato_service.exception';
export default class ContratosService {
  constructor(
    private readonly contratoRepo: IContratoRepository,
    private readonly empresaRepo: IEmpresaContratadaRepository,
    private readonly aditivoRepo: IAditivoRepository,
    private readonly paralisacaoRepo: IParalisacaoRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  async create(param: {
    obraId: string;
    empresaContratadaId: string;
    numero: string;
    dataOs: string;
    tipoPrazoExecucao: string;
    prazoExecucaoDias?: number | null;
    prazoExecucaoData?: string | null;
    objeto?: string | null;
    dataAssinatura?: string | null;
    fimVigencia?: string | null;
    fontes: { fonteId: string; valor: string }[];
  }): AsyncResult<AppException, ContratoEntity> {
    try {
      const ctx = this.tc.require();
      const obra = await this.ds.query(
        `SELECT id, considerar_sabado, considerar_domingo FROM "${ctx.schemaName}"."obras" WHERE id=$1 AND deleted_at IS NULL`,
        [param.obraId],
      );
      if (!obra.length)
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const emp = await this.empresaRepo.findById(param.empresaContratadaId);
      if (emp.isLeft()) return left(emp.value);
      if (!emp.value)
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.EMPRESA_CONTRATADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (param.fontes?.length) {
        for (const f of param.fontes) {
          const fonte = await this.ds.query(
            `SELECT id FROM "${ctx.schemaName}"."fontes" WHERE id=$1 AND tenant_id=$2`,
            [f.fonteId, ctx.tenantId],
          );
          if (!fonte.length)
            return left(
              new ContratoRepositoryException({
                code: ErrorCodeConstants.FONTE_NOT_FOUND,
                statusCode: 422,
              }),
            );
        }
      }
      const exists = await this.contratoRepo.findByObraSingle(param.obraId);
      if (exists.isLeft()) return left(exists.value);
      if (exists.value)
        return left(
          new ContratoServiceException({
            code: ErrorCodeConstants.CONTRATO_DUPLICATE_NUMERO,
            statusCode: 409,
          }),
        );
      const entity = ContratoEntity.create({
        tenantId: ctx.tenantId,
        obraId: param.obraId,
        empresaContratadaId: param.empresaContratadaId,
        numero: param.numero,
        dataOs: param.dataOs,
        tipoPrazoExecucao: param.tipoPrazoExecucao as any,
        prazoExecucaoDias: param.prazoExecucaoDias ?? null,
        prazoExecucaoData: param.prazoExecucaoData ?? null,
        objeto: param.objeto ?? null,
        dataAssinatura: param.dataAssinatura ?? null,
        fimVigencia: param.fimVigencia ?? null,
        fontes: param.fontes,
      });
      return this.contratoRepo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      if ((cause as any)?.code === '23505')
        return left(
          new ContratoServiceException({
            code: ErrorCodeConstants.CONTRATO_DUPLICATE_NUMERO,
            statusCode: 409,
            cause,
          }),
        );
      return left(
        new ContratoServiceException({
          code: ErrorCodeConstants.CONTRATO_CREATE_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async list(
    pageOptions: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<ContratoEntity>> {
    return this.contratoRepo.findPage(pageOptions);
  }
  async getById(id: string): AsyncResult<AppException, ContratoEntity> {
    const res = await this.contratoRepo.findById(id);
    if (res.isLeft()) return left(res.value);
    if (!res.value)
      return left(
        new ContratoRepositoryException({
          code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(res.value);
  }
  async update(
    id: string,
    param: Partial<{
      empresaContratadaId: string;
      numero: string;
      objeto: string | null;
      dataAssinatura: string | null;
      fimVigencia: string | null;
      dataOs: string;
      tipoPrazoExecucao: string;
      prazoExecucaoDias: number | null;
      prazoExecucaoData: string | null;
      fontes: { fonteId: string; valor: string }[];
    }>,
  ): AsyncResult<AppException, ContratoEntity> {
    try {
      const found = await this.getById(id);
      if (found.isLeft()) return left(found.value);
      const previous = found.value.toObject();
      if (param.empresaContratadaId) {
        const emp = await this.empresaRepo.findById(param.empresaContratadaId);
        if (emp.isLeft()) return left(emp.value);
        if (!emp.value)
          return left(new ContratoRepositoryException({ code: ErrorCodeConstants.EMPRESA_CONTRATADA_NOT_FOUND, statusCode: 404 }));
      }
      const next = ContratoEntity.fromData({
        ...previous,
        empresaContratadaId: param.empresaContratadaId ?? previous.empresaContratadaId,
        numero: param.numero?.trim() ?? previous.numero,
        objeto: param.objeto !== undefined ? param.objeto?.trim() || null : previous.objeto,
        dataAssinatura: param.dataAssinatura !== undefined ? param.dataAssinatura : previous.dataAssinatura,
        fimVigencia: param.fimVigencia !== undefined ? param.fimVigencia : previous.fimVigencia,
        dataOs: param.dataOs ?? previous.dataOs,
        tipoPrazoExecucao: (param.tipoPrazoExecucao ?? previous.tipoPrazoExecucao) as typeof previous.tipoPrazoExecucao,
        prazoExecucaoDias: param.prazoExecucaoDias !== undefined ? param.prazoExecucaoDias : previous.prazoExecucaoDias,
        prazoExecucaoData: param.prazoExecucaoData !== undefined ? param.prazoExecucaoData : previous.prazoExecucaoData,
        fontes: param.fontes ?? previous.fontes,
        updatedAt: new Date(),
      });
      return this.contratoRepo.save(next);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new ContratoServiceException({ code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
  async delete(id: string): AsyncResult<AppException, void> {
    const found = await this.getById(id);
    if (found.isLeft()) return left(found.value);
    return this.contratoRepo.delete(id);
  }
  async prazoFinal(
    id: string,
  ): AsyncResult<
    AppException,
    {
      prazoFinal: string;
      totalDias: number;
      diasBase: number;
      diasParalisacoes: number;
      diasAditivos: number;
    }
  > {
    try {
      const contratoRes = await this.contratoRepo.findById(id);
      if (contratoRes.isLeft()) return left(contratoRes.value);
      if (!contratoRes.value)
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const contrato = contratoRes.value;
      const aditivosRes = await this.aditivoRepo.listByContrato(id);
      const paralisacoesRes = await this.paralisacaoRepo.listByContrato(id);
      const obraRows = await this.ds.query(
        `SELECT considerar_sabado, considerar_domingo FROM "${this.tc.require().schemaName}"."obras" WHERE id=$1`,
        [contrato.obraId],
      );
      const considerarSabado = obraRows[0]?.considerar_sabado ?? false;
      const considerarDomingo = obraRows[0]?.considerar_domingo ?? false;
      const result = calcularPrazoFinalExecucao({
        dataOs: contrato.dataOs,
        tipoPrazoExecucao: contrato.tipoPrazoExecucao,
        prazoExecucaoDias: contrato.prazoExecucaoDias,
        prazoExecucaoData: contrato.prazoExecucaoData,
        paralisacoes: (paralisacoesRes.isRight()
          ? paralisacoesRes.value
          : []
        ).map((p) => ({
          dataParalisacao: (p as any).dataParalisacao,
          diasParados: (p as any).diasParados ?? null,
          dataReinicio: (p as any).dataReinicio ?? null,
        })),
        aditivos: (aditivosRes.isRight() ? aditivosRes.value : []).map((a) => ({
          tipo: (a as any).tipo,
          tipoPrazoExecucao: (a as any).tipoPrazoExecucao ?? null,
          prazoExecucaoDias: (a as any).prazoExecucaoDias ?? null,
          prazoExecucaoData: (a as any).prazoExecucaoData ?? null,
        })),
        considerarSabado,
        considerarDomingo,
        dataReferencia: new Date().toISOString().slice(0, 10),
      });
      return right(result);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ContratoServiceException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
  async valores(
    id: string,
  ): AsyncResult<
    AppException,
    { valorOriginal: string; valorAditivos: string; valorTotal: string }
  > {
    try {
      const contratoRes = await this.contratoRepo.findById(id);
      if (contratoRes.isLeft()) return left(contratoRes.value);
      if (!contratoRes.value)
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const contrato = contratoRes.value;
      const valorOriginal = contrato.fontes
        .reduce((s, f) => s + Number(f.valor), 0)
        .toFixed(2);
      const aditivosRes = await this.aditivoRepo.listByContrato(id);
      let valorAditivos = 0;
      if (aditivosRes.isRight()) {
        for (const a of aditivosRes.value) {
          const fontes = (a as any).fontes ?? [];
          for (const f of fontes) valorAditivos += Number(f.valor);
          // also need aditivo_fonte table - simplified: we ignore for now, use 0 if not stored
        }
      }
      // fetch aditivo_fonte directly
      const s = this.tc.require().schemaName;
      const rows = await this.ds.query(
        `SELECT valor FROM "${s}"."aditivo_fonte" WHERE aditivo_id IN (SELECT id FROM "${s}"."aditivo" WHERE contrato_id=$1)`,
        [id],
      );
      valorAditivos = rows.reduce(
        (sum: number, r: any) => sum + Number(r.valor),
        0,
      );
      const total = (Number(valorOriginal) + valorAditivos).toFixed(2);
      return right({
        valorOriginal,
        valorAditivos: valorAditivos.toFixed(2),
        valorTotal: total,
      });
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ContratoServiceException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ContratoDomainException from '@/modules/contratos/exceptions/contrato_domain.exception';
import { TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';
export interface ContratoFonteProps {
  fonteId: string;
  valor: string;
}
export interface ContratoProps {
  id: string;
  tenantId: string;
  obraId: string;
  empresaContratadaId: string;
  numero: string;
  objeto: string | null;
  dataAssinatura: string | null;
  fimVigencia: string | null;
  dataOs: string;
  tipoPrazoExecucao: TipoPrazoExecucao;
  prazoExecucaoDias: number | null;
  prazoExecucaoData: string | null;
  fontes: ContratoFonteProps[];
  createdAt: Date;
  updatedAt: Date;
}
export default class ContratoEntity {
  private constructor(private readonly props: ContratoProps) {}
  static create(p: {
    tenantId: string;
    obraId: string;
    empresaContratadaId: string;
    numero: string;
    dataOs: string;
    tipoPrazoExecucao: TipoPrazoExecucao;
    prazoExecucaoDias?: number | null;
    prazoExecucaoData?: string | null;
    objeto?: string | null;
    dataAssinatura?: string | null;
    fimVigencia?: string | null;
    fontes: ContratoFonteProps[];
  }): ContratoEntity {
    if (!p.obraId)
      throw new ContratoDomainException({
        code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      });
    if (!p.empresaContratadaId)
      throw new ContratoDomainException({
        code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      });
    const numero = p.numero?.trim();
    if (!numero)
      throw new ContratoDomainException({
        code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      });
    if (!p.dataOs)
      throw new ContratoDomainException({
        code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      });
    if (!Object.values(TipoPrazoExecucao).includes(p.tipoPrazoExecucao))
      throw new ContratoDomainException({
        code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      });
    if (p.tipoPrazoExecucao === TipoPrazoExecucao.DIAS) {
      if (p.prazoExecucaoDias == null || p.prazoExecucaoDias < 1)
        throw new ContratoDomainException({
          code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
        });
    } else {
      if (!p.prazoExecucaoData)
        throw new ContratoDomainException({
          code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
        });
    }
    if (!p.fontes || p.fontes.length < 1)
      throw new ContratoDomainException({
        code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
      });
    for (const f of p.fontes) {
      if (!f.fonteId)
        throw new ContratoDomainException({
          code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
        });
      if (
        !f.valor ||
        !/^\d+(\.\d{1,2})?$/.test(f.valor) ||
        Number(f.valor) <= 0
      )
        throw new ContratoDomainException({
          code: ErrorCodeConstants.CONTRATO_INVALID_INPUT,
        });
    }
    const now = new Date();
    return new ContratoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      obraId: p.obraId,
      empresaContratadaId: p.empresaContratadaId,
      numero,
      objeto: p.objeto?.trim() || null,
      dataAssinatura: p.dataAssinatura || null,
      fimVigencia: p.fimVigencia || null,
      dataOs: p.dataOs,
      tipoPrazoExecucao: p.tipoPrazoExecucao,
      prazoExecucaoDias: p.prazoExecucaoDias ?? null,
      prazoExecucaoData: p.prazoExecucaoData || null,
      fontes: p.fontes.map((f) => ({ fonteId: f.fonteId, valor: f.valor })),
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(p: ContratoProps): ContratoEntity {
    return new ContratoEntity(p);
  }
  toObject(): ContratoProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get obraId() {
    return this.props.obraId;
  }
  get empresaContratadaId() {
    return this.props.empresaContratadaId;
  }
  get numero() {
    return this.props.numero;
  }
  get dataOs() {
    return this.props.dataOs;
  }
  get tipoPrazoExecucao() {
    return this.props.tipoPrazoExecucao;
  }
  get prazoExecucaoDias() {
    return this.props.prazoExecucaoDias;
  }
  get prazoExecucaoData() {
    return this.props.prazoExecucaoData;
  }
  get fontes() {
    return this.props.fontes;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}

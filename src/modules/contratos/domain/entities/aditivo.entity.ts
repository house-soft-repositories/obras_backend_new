import ErrorCodeConstants from '@/core/constants/error_code.constants';
import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';
import AditivoDomainException from '@/modules/contratos/exceptions/aditivo_domain.exception';
import { randomUUID } from 'node:crypto';
export interface AditivoProps {
  id: string;
  tenantId: string;
  contratoId: string;
  numero: string;
  tipo: TipoAditivo;
  dataAssinatura: string | null;
  tipoPrazoExecucao: TipoPrazoExecucao | null;
  prazoExecucaoDias: number | null;
  prazoExecucaoData: string | null;
  vigenciaAditivada: string | null;
  observacoes: string | null;
  fontes: { fonteId: string; valor: string }[];
  createdAt: Date;
  updatedAt: Date;
  ordem?: number;
}
export default class AditivoEntity {
  private constructor(private readonly props: AditivoProps) {}
  static create(p: {
    tenantId: string;
    contratoId: string;
    numero: string;
    tipo: TipoAditivo;
    dataAssinatura?: string | null;
    tipoPrazoExecucao?: TipoPrazoExecucao | null;
    prazoExecucaoDias?: number | null;
    prazoExecucaoData?: string | null;
    vigenciaAditivada?: string | null;
    observacoes?: string | null;
    fontes?: { fonteId: string; valor: string }[];
    ordem?: number;
  }): AditivoEntity {
    const numero = p.numero?.trim();
    if (!numero)
      throw new AditivoDomainException({
        code: ErrorCodeConstants.ADITIVO_INVALID_INPUT,
      });
    if (!Object.values(TipoAditivo).includes(p.tipo))
      throw new AditivoDomainException({
        code: ErrorCodeConstants.ADITIVO_INVALID_INPUT,
      });
    if (p.tipo === TipoAditivo.PRAZO || p.tipo === TipoAditivo.PRAZO_E_VALOR) {
      if (!p.tipoPrazoExecucao)
        throw new AditivoDomainException({
          code: ErrorCodeConstants.ADITIVO_INVALID_INPUT,
        });
      if (
        p.tipoPrazoExecucao === TipoPrazoExecucao.DIAS &&
        (p.prazoExecucaoDias == null || p.prazoExecucaoDias < 1)
      )
        throw new AditivoDomainException({
          code: ErrorCodeConstants.ADITIVO_INVALID_INPUT,
        });
      if (
        p.tipoPrazoExecucao === TipoPrazoExecucao.DATA &&
        !p.prazoExecucaoData
      )
        throw new AditivoDomainException({
          code: ErrorCodeConstants.ADITIVO_INVALID_INPUT,
        });
    }
    if (
      (p.tipo === TipoAditivo.VALOR || p.tipo === TipoAditivo.PRAZO_E_VALOR) &&
      p.fontes
    ) {
      for (const f of p.fontes)
        if (!f.valor || Number(f.valor) <= 0)
          throw new AditivoDomainException({
            code: ErrorCodeConstants.ADITIVO_INVALID_INPUT,
          });
    }
    const now = new Date();
    return new AditivoEntity({
      id: randomUUID(),
      tenantId: p.tenantId,
      contratoId: p.contratoId,
      numero,
      tipo: p.tipo,
      dataAssinatura: p.dataAssinatura || null,
      tipoPrazoExecucao: p.tipoPrazoExecucao ?? null,
      prazoExecucaoDias: p.prazoExecucaoDias ?? null,
      prazoExecucaoData: p.prazoExecucaoData || null,
      vigenciaAditivada: p.vigenciaAditivada || null,
      observacoes: p.observacoes?.trim() || null,
      fontes: p.fontes || [],
      createdAt: now,
      updatedAt: now,
      ordem: p.ordem,
    });
  }
  static fromData(p: AditivoProps): AditivoEntity {
    return new AditivoEntity(p);
  }
  toObject(): AditivoProps {
    return { ...this.props };
  }
  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get contratoId() {
    return this.props.contratoId;
  }
  get numero() {
    return this.props.numero;
  }
  get tipo() {
    return this.props.tipo;
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
}

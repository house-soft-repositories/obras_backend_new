import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import {
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type AutoInfracaoProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  fiscalizacaoId: string | null;
  numero: string;
  tipo: TipoAutoInfracao;
  dataEmissao: string;
  prazoDias: number | null;
  dataLimite: string | null;
  baseLegal: string | null;
  descricao: string;
  valorMulta: string | null;
  situacao: SituacaoAutoInfracao;
  dataEncerramento: string | null;
  observacoes: string | null;
  lavradoPorUsuarioId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAutoInfracaoProps = Omit<
  AutoInfracaoProps,
  'id' | 'situacao' | 'createdAt' | 'updatedAt'
> & { situacao?: SituacaoAutoInfracao };

export default class AutoInfracaoEntity {
  private constructor(private readonly props: AutoInfracaoProps) {}

  static create(props: CreateAutoInfracaoProps): AutoInfracaoEntity {
    if (
      !props.tenantId ||
      !props.obraPrivadaId ||
      !props.numero?.trim() ||
      !props.dataEmissao ||
      !props.descricao?.trim() ||
      !props.lavradoPorUsuarioId ||
      !Object.values(TipoAutoInfracao).includes(props.tipo)
    ) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.AUTO_INFRACAO_INVALID_INPUT,
      });
    }
    const now = new Date();
    return new AutoInfracaoEntity({
      ...props,
      id: randomUUID(),
      numero: props.numero.trim(),
      descricao: props.descricao.trim(),
      baseLegal: props.baseLegal?.trim() || null,
      observacoes: props.observacoes?.trim() || null,
      situacao: props.situacao ?? SituacaoAutoInfracao.ABERTO,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: AutoInfracaoProps): AutoInfracaoEntity {
    return new AutoInfracaoEntity(props);
  }

  toObject(): AutoInfracaoProps {
    return { ...this.props };
  }

  get id(): string {
    return this.props.id;
  }
}

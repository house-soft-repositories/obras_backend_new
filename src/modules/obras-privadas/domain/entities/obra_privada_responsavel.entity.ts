import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type ObraPrivadaResponsavelProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  profissionalTecnicoId: string;
  papel: PapelResponsavelTecnico;
  tipoDocumento: TipoDocumentoResponsabilidade;
  numeroDocumento: string;
  dataDocumento: string | null;
  arquivoId: string | null;
  dataInicio: string | null;
  dataBaixa: string | null;
  motivoBaixa: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateObraPrivadaResponsavelProps = Omit<
  ObraPrivadaResponsavelProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export default class ObraPrivadaResponsavelEntity {
  private constructor(private readonly props: ObraPrivadaResponsavelProps) {}
  static create(
    props: CreateObraPrivadaResponsavelProps,
  ): ObraPrivadaResponsavelEntity {
    const dateFields = [props.dataDocumento, props.dataInicio, props.dataBaixa];
    const hasInvalidDate = dateFields.some(
      (value) =>
        value !== null &&
        (!value ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(Date.parse(value))),
    );
    const hasBaixaReasonMismatch =
      props.dataBaixa === null
        ? props.motivoBaixa !== null
        : !props.motivoBaixa?.trim();
    if (
      !props.tenantId ||
      !props.obraPrivadaId ||
      !props.profissionalTecnicoId ||
      !props.numeroDocumento?.trim() ||
      !Object.values(PapelResponsavelTecnico).includes(props.papel) ||
      !Object.values(TipoDocumentoResponsabilidade).includes(
        props.tipoDocumento,
      ) ||
      hasInvalidDate ||
      hasBaixaReasonMismatch
    )
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_RESPONSAVEL_INVALID_INPUT,
      });
    const now = new Date();
    return new ObraPrivadaResponsavelEntity({
      ...props,
      id: randomUUID(),
      numeroDocumento: props.numeroDocumento.trim(),
      motivoBaixa: props.motivoBaixa?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }
  static fromData(
    props: ObraPrivadaResponsavelProps,
  ): ObraPrivadaResponsavelEntity {
    return new ObraPrivadaResponsavelEntity(props);
  }
  toObject(): ObraPrivadaResponsavelProps {
    return { ...this.props };
  }
  get id(): string {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get obraPrivadaId(): string {
    return this.props.obraPrivadaId;
  }
  get profissionalTecnicoId(): string {
    return this.props.profissionalTecnicoId;
  }
  get papel(): PapelResponsavelTecnico {
    return this.props.papel;
  }
  get tipoDocumento(): TipoDocumentoResponsabilidade {
    return this.props.tipoDocumento;
  }
  get numeroDocumento(): string {
    return this.props.numeroDocumento;
  }
  get dataDocumento(): string | null {
    return this.props.dataDocumento;
  }
  get arquivoId(): string | null {
    return this.props.arquivoId;
  }
  get dataInicio(): string | null {
    return this.props.dataInicio;
  }
  get dataBaixa(): string | null {
    return this.props.dataBaixa;
  }
  get motivoBaixa(): string | null {
    return this.props.motivoBaixa;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

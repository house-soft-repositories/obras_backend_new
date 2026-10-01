import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';

export type ObraPrivadaObservacaoProps = {
  id: string;
  tenantId: string;
  obraPrivadaId: string;
  texto: string;
  autorUsuarioId: string;
  createdAt: Date;
};

export type CreateObraPrivadaObservacaoProps = Omit<
  ObraPrivadaObservacaoProps,
  'id' | 'createdAt'
>;

export default class ObraPrivadaObservacaoEntity {
  private constructor(private readonly props: ObraPrivadaObservacaoProps) {}

  static create(
    props: CreateObraPrivadaObservacaoProps,
  ): ObraPrivadaObservacaoEntity {
    if (
      !props.tenantId ||
      !props.obraPrivadaId ||
      !props.autorUsuarioId ||
      !props.texto?.trim()
    ) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_OBSERVACAO_INVALID_INPUT,
      });
    }
    return new ObraPrivadaObservacaoEntity({
      ...props,
      id: randomUUID(),
      texto: props.texto.trim(),
      createdAt: new Date(),
    });
  }

  static fromData(
    props: ObraPrivadaObservacaoProps,
  ): ObraPrivadaObservacaoEntity {
    return new ObraPrivadaObservacaoEntity(props);
  }
  toObject(): ObraPrivadaObservacaoProps {
    return { ...this.props };
  }
  get id(): string {
    return this.props.id;
  }
}

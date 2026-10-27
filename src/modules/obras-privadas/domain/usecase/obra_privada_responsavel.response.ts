import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';

export type ObraPrivadaResponsavelResponseData = {
  id: string;
  obraPrivadaId: string;
  profissionalTecnicoId: string;
  papel: string;
  tipoDocumento: string;
  numeroDocumento: string;
  dataDocumento: string | null;
  arquivoId: string | null;
  dataInicio: string | null;
  dataBaixa: string | null;
  motivoBaixa: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function fromEntity(
  entity: ObraPrivadaResponsavelEntity,
): ObraPrivadaResponsavelResponseData {
  return {
    id: entity.id,
    obraPrivadaId: entity.obraPrivadaId,
    profissionalTecnicoId: entity.profissionalTecnicoId,
    papel: entity.papel,
    tipoDocumento: entity.tipoDocumento,
    numeroDocumento: entity.numeroDocumento,
    dataDocumento: entity.dataDocumento,
    arquivoId: entity.arquivoId,
    dataInicio: entity.dataInicio,
    dataBaixa: entity.dataBaixa,
    motivoBaixa: entity.motivoBaixa,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class ObraPrivadaResponsavelResponse {
  constructor(private readonly entity: ObraPrivadaResponsavelEntity) {}

  fromResponse() {
    const response = fromEntity(this.entity);
    return {
      ...response,
      createdAt: response.createdAt.toISOString(),
      updatedAt: response.updatedAt.toISOString(),
    };
  }
}

export class ObraPrivadaResponsaveisResponse {
  constructor(private readonly entities: ObraPrivadaResponsavelEntity[]) {}

  fromResponse() {
    return this.entities.map((entity) => {
      const response = fromEntity(entity);
      return {
        ...response,
        createdAt: response.createdAt.toISOString(),
        updatedAt: response.updatedAt.toISOString(),
      };
    });
  }
}

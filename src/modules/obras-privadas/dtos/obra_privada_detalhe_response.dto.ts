import ObraPrivadaResponseDto from '@/modules/obras-privadas/dtos/obra_privada_response.dto';
import {
  ObraPrivadaDetalhe,
  ResponsavelDetalhe,
} from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import PessoaResponseDto from '@/modules/pessoas/dtos/pessoa_response.dto';

function toIso(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export default class ObraPrivadaDetalheResponseDto {
  static fromDetalhe(detalhe: ObraPrivadaDetalhe) {
    const obra = detalhe.obra.toObject();
    return {
      ...ObraPrivadaResponseDto.fromEntity(detalhe.obra),
      observacoes: obra.observacoes,
      orgaoId: obra.orgaoId,
      inscricaoImobiliaria: obra.inscricaoImobiliaria,
      matriculaRgi: obra.matriculaRgi,
      cartorio: obra.cartorio,
      cep: obra.cep,
      numero: obra.numero,
      complemento: obra.complemento,
      bairro: obra.bairro,
      localidadeId: obra.localidadeId,
      latitude: obra.latitude,
      longitude: obra.longitude,
      geoOrigem: obra.geoOrigem,
      andamento: obra.andamento,
      habiteSe: obra.habiteSe,
      dataInicio: toIso(obra.dataInicio),
      dataPrevistaConclusao: toIso(obra.dataPrevistaConclusao),
      proprietario: detalhe.proprietario
        ? PessoaResponseDto.fromEntity(detalhe.proprietario)
        : null,
      responsaveis: detalhe.responsaveis.map(
        (r: ResponsavelDetalhe) => ({ ...r }),
      ),
      derivados: { ...detalhe.derivados },
    };
  }
}

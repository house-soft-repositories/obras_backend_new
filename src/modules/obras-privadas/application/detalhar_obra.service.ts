import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import {
  SituacaoAutoInfracao,
  SituacaoRegistroAlvara,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import IDetalharObraUseCase, {
  DetalharObraParam,
  ObraPrivadaDerivados,
  ObraPrivadaDetalhe,
  ResponsavelDetalhe,
} from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import {
  alvaraVigente,
  diasAteVencimento,
} from '@/modules/obras-privadas/domain/situacao_alvara';
import {
  estaAutuada,
  estaEmbargada,
} from '@/modules/obras-privadas/domain/prazo_auto_infracao';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';

const MS_DIA = 86_400_000;

function toIsoDate(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export default class DetalharObraService implements IDetalharObraUseCase {
  constructor(
    private readonly obras: IObraPrivadaRepository,
    private readonly pessoas: IPessoaRepository,
    private readonly profissionais: IProfissionalTecnicoRepository,
    private readonly responsaveis: IObraPrivadaResponsavelRepository,
    private readonly fiscalizacoes: IFiscalizacaoRepository,
    private readonly autos: IAutoInfracaoRepository,
    private readonly alvaras: IAlvaraRepository,
  ) {}

  async execute(
    param: DetalharObraParam,
  ): AsyncResult<AppException, ObraPrivadaDetalhe> {
    try {
      const found = await this.obras.findById(param.id);
      if (found.isLeft()) return left(found.value);
      if (!found.value || found.value.toObject().deletedAt)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const obra = found.value.toObject();
      const proprietario = await this.pessoas.findById(
        obra.proprietarioPessoaId,
      );
      if (proprietario.isLeft()) return left(proprietario.value);
      const responsaveis = await this.responsaveis.findByObraPrivadaId(
        param.id,
      );
      if (responsaveis.isLeft()) return left(responsaveis.value);
      const detalhes: ResponsavelDetalhe[] = [];
      for (const responsavel of responsaveis.value) {
        const detalhe = await this.hidratarResponsavel(responsavel);
        if (detalhe.isLeft()) return left(detalhe.value);
        detalhes.push(detalhe.value);
      }
      const visitas = await this.fiscalizacoes.findByObraPrivadaId(param.id);
      if (visitas.isLeft()) return left(visitas.value);
      const autos = await this.autos.findByObraPrivadaId(param.id);
      if (autos.isLeft()) return left(autos.value);
      const alvaras = await this.alvaras.findByObraPrivadaId(param.id);
      if (alvaras.isLeft()) return left(alvaras.value);
      return right({
        obra: found.value,
        proprietario: proprietario.value,
        responsaveis: detalhes,
        derivados: this.calcularDerivados(visitas.value, autos.value, alvaras.value),
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async hidratarResponsavel(
    responsavel: ObraPrivadaResponsavelEntity,
  ): AsyncResult<AppException, ResponsavelDetalhe> {
    const value = responsavel.toObject();
    const profissional = await this.profissionais.findById(
      value.profissionalTecnicoId,
    );
    if (profissional.isLeft()) return left(profissional.value);
    if (!profissional.value) {
      return right({
        id: value.id,
        profissionalTecnicoId: value.profissionalTecnicoId,
        nome: null,
        documento: null,
        registro: null,
        titulo: null,
        papel: value.papel,
        tipoDocumento: value.tipoDocumento,
        numeroDocumento: value.numeroDocumento,
        dataDocumento: toIsoDate(value.dataDocumento),
        arquivoId: value.arquivoId,
        dataInicio: toIsoDate(value.dataInicio),
        dataBaixa: toIsoDate(value.dataBaixa),
        motivoBaixa: value.motivoBaixa,
        vigente: value.dataBaixa === null,
      });
    }
    const prof = profissional.value;
    const pessoa = await this.pessoas.findById(prof.pessoaId);
    if (pessoa.isLeft()) return left(pessoa.value);
    const uf = prof.ufRegistro ? `-${prof.ufRegistro}` : '';
    return right({
      id: value.id,
      profissionalTecnicoId: value.profissionalTecnicoId,
      nome: pessoa.value?.nome ?? null,
      documento: pessoa.value?.documento ?? null,
      registro: `${prof.conselho}${uf} ${prof.numeroRegistro}`,
      titulo: prof.titulo,
      papel: value.papel,
      tipoDocumento: value.tipoDocumento,
      numeroDocumento: value.numeroDocumento,
      dataDocumento: toIsoDate(value.dataDocumento),
      arquivoId: value.arquivoId,
      dataInicio: toIsoDate(value.dataInicio),
      dataBaixa: toIsoDate(value.dataBaixa),
      motivoBaixa: value.motivoBaixa,
      vigente: value.dataBaixa === null,
    });
  }

  private calcularDerivados(
    visitas: {
      toObject(): {
        dataFiscalizacao: string;
        etapaConstatada: string | null;
      };
    }[],
    autos: {
      toObject(): {
        tipo: TipoAutoInfracao;
        situacao: SituacaoAutoInfracao;
        dataLimite: string | null;
      };
    }[],
    alvaras: {
      toObject(): {
        id: string;
        numero: string | null;
        ano: number;
        situacao: SituacaoRegistroAlvara;
        dataEmissao: string | null;
        dataValidade: string | null;
      };
    }[],
  ): ObraPrivadaDerivados {
    const resumoAutos = autos.map((a) => a.toObject());
    const ultima = visitas.length > 0 ? visitas[0].toObject() : null;
    const ultimaVisitaEm = ultima ? toIsoDate(ultima.dataFiscalizacao) : null;
    const alvarasResumo = alvaras.map((a) => a.toObject());
    const vigente = alvaraVigente(alvarasResumo);
    const completo = vigente
      ? (alvarasResumo.find((a) => a.id === vigente.id) ?? null)
      : null;
    const validade = completo ? toIsoDate(completo.dataValidade) : null;
    return {
      fiscalizada: visitas.length > 0,
      autuada: estaAutuada(resumoAutos),
      embargada: estaEmbargada(resumoAutos),
      autosAbertos: resumoAutos.filter(
        (a) =>
          a.situacao === SituacaoAutoInfracao.ABERTO ||
          a.situacao === SituacaoAutoInfracao.EM_RECURSO,
      ).length,
      ultimaVisitaEm,
      diasSemVisita: ultimaVisitaEm
        ? Math.round(
            (Date.now() - Date.parse(`${ultimaVisitaEm}T00:00:00Z`)) / MS_DIA,
          )
        : null,
      etapaAtual: ultima?.etapaConstatada ?? null,
      alvaraVigenteNumero:
        completo?.numero != null ? `${completo.numero}/${completo.ano}` : null,
      alvaraVigenteValidade: validade,
      diasAteVencimentoAlvara: diasAteVencimento(validade),
    };
  }
}

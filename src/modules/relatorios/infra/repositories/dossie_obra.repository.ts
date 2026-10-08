/**
 * Leitura do dossiê da obra pública via TypeORM (sem SQL cru): usa
 * `withTenantManager` + `manager.getRepository(Model)` com relações e
 * filtros tipados sobre os modelos existentes de Obras, Contratos e
 * Documentos. Estágios e medições vêm de `RelatoriosQuery`
 * (cronograma não tem modelos TypeORM neste backend — nenhum SQL novo).
 */
import { DataSource, EntityManager, In, IsNull, Like } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import { withTenantManager } from '@/core/multitenancy/tenant_manager';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import type IDossieObraRepository from '@/modules/relatorios/adapters/dossie_obra_repository.interface';
import type {
  DadosAditivoDossie,
  DadosContratoDossie,
  DadosEquipeDossie,
  DadosEstagioDossie,
  DadosMedicaoDossie,
  DadosObraDossie,
  DadosParalisacaoDossie,
  DossieObraCarregado,
  DossieObraSemFluxo,
  FotoOrigemDossie,
} from '@/modules/relatorios/domain/relatorios/dossie_obra';
import type {
  EstagioDetalheRelatorio,
  MedicaoDetalheRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosRepositoryException from '@/modules/relatorios/exceptions/relatorios_repository.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import { AditivoFonteModel, AditivoModel } from '@/modules/contratos/infra/models/aditivo.model';
import {
  ContratoFonteModel,
  ContratoModel,
} from '@/modules/contratos/infra/models/contrato.model';
import { ParalisacaoModel } from '@/modules/contratos/infra/models/paralisacao.model';
import ArquivoModel from '@/modules/documentos/infra/models/arquivo.model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { ObraResponsavelModel } from '@/modules/obras/infra/models/obra_items.model';

function dia(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value.trim()) return value.slice(0, 10);
  return null;
}

function textoOuNulo(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function somarValores(valores: { valor: string }[]): number {
  return valores.reduce((total, fonte) => total + Number(fonte.valor ?? 0), 0);
}

export default class DossieObraRepository implements IDossieObraRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
    private readonly query: RelatoriosQuery,
  ) {}

  async carregar(
    obraId: string,
  ): AsyncResult<AppException, DossieObraCarregado | null> {
    try {
      const [bloco, detalhe] = await Promise.all([
        withTenantManager(
          this.dataSource,
          this.tenantContext,
          async (manager: EntityManager) => {
            const obra = await manager.getRepository(ObraModel).findOne({
              where: { id: obraId, deletedAt: IsNull() },
              relations: { orgao: true, localidade: true },
            });
            if (!obra) return null;
            const [responsaveis, contratos, arquivos] = await Promise.all([
              manager.getRepository(ObraResponsavelModel).find({
                where: { obraId },
                relations: { usuario: true },
              }),
              manager.getRepository(ContratoModel).find({
                where: { obraId },
                relations: { empresaContratada: true },
                order: { dataOs: 'DESC' },
                take: 1,
              }),
              // Fotos = arquivos de imagem da obra. O DocumentosContext não
              // classifica "foto" como categoria; o mime type é o marcador.
              manager.getRepository(ArquivoModel).find({
                where: { obraId, mimeType: Like('image/%') },
                order: { createdAt: 'ASC' },
              }),
            ]);
            const contrato = contratos[0] ?? null;
            const [fontes, aditivos, paralisacoes] = contrato
              ? await Promise.all([
                  manager
                    .getRepository(ContratoFonteModel)
                    .find({ where: { contratoId: contrato.id } }),
                  manager.getRepository(AditivoModel).find({
                    where: { contratoId: contrato.id },
                    order: { dataAssinatura: 'ASC', numero: 'ASC' },
                  }),
                  manager.getRepository(ParalisacaoModel).find({
                    where: { contratoId: contrato.id },
                    order: { dataParalisacao: 'ASC' },
                  }),
                ])
              : [[], [], []];
            const fontesAditivo = aditivos.length
              ? await manager.getRepository(AditivoFonteModel).find({
                  where: {
                    aditivoId: In(aditivos.map((aditivo) => aditivo.id)),
                  },
                })
              : [];
            return {
              obra,
              responsaveis,
              contrato,
              fontes,
              aditivos,
              fontesAditivo,
              paralisacoes,
              arquivos,
            };
          },
        ),
        this.query.carregarDetalheObra(obraId),
      ]);
      if (!bloco) return right(null);
      return right({
        dossie: this.montarDossie(bloco, detalhe.estagios, detalhe.medicoes),
        fotos: bloco.arquivos.map((arquivo) => this.montarFoto(arquivo)),
      });
    } catch (cause) {
      if (cause instanceof RelatoriosRepositoryException) return left(cause);
      return left(
        new RelatoriosRepositoryException({
          code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  private montarDossie(
    bloco: {
      obra: ObraModel;
      responsaveis: ObraResponsavelModel[];
      contrato: ContratoModel | null;
      fontes: ContratoFonteModel[];
      aditivos: AditivoModel[];
      fontesAditivo: AditivoFonteModel[];
      paralisacoes: ParalisacaoModel[];
    },
    estagios: EstagioDetalheRelatorio[],
    medicoes: MedicaoDetalheRelatorio[],
  ): DossieObraSemFluxo {
    const fontesPorAditivo = new Map<string, AditivoFonteModel[]>();
    for (const fonte of bloco.fontesAditivo) {
      const lista = fontesPorAditivo.get(fonte.aditivoId) ?? [];
      lista.push(fonte);
      fontesPorAditivo.set(fonte.aditivoId, lista);
    }
    return {
      obra: this.montarObra(bloco.obra),
      equipe: this.montarEquipe(bloco.responsaveis),
      contrato: this.montarContrato(bloco.contrato, bloco.fontes),
      aditivos: bloco.aditivos.map((aditivo) =>
        this.montarAditivo(aditivo, fontesPorAditivo.get(aditivo.id) ?? []),
      ),
      paralisacoes: bloco.paralisacoes.map((paralisacao) =>
        this.montarParalisacao(paralisacao),
      ),
      estagios: estagios.map((row) => this.montarEstagio(row)),
      medicoes: medicoes.map((row) => this.montarMedicao(row)),
    };
  }

  private montarObra(obra: ObraModel): DadosObraDossie {
    return {
      codigo: obra.codigo,
      nome: obra.nome,
      descricao: textoOuNulo(obra.descricao),
      tipo: obra.tipo,
      status: obra.status,
      tipoFinanciamento: obra.tipoFinanciamento,
      acaoConveniada: textoOuNulo(obra.acaoConveniada),
      prioritaria: obra.prioritaria,
      dataInicio: dia(obra.dataInicio),
      dataPrazo: dia(obra.dataPrazo),
      dataPactuada: dia(obra.dataPactuada),
      orgaoNome: obra.orgao?.nome ?? null,
      localidadeNome: obra.localidade
        ? `${obra.localidade.nome}/${obra.localidade.uf}`
        : null,
      secretario: textoOuNulo(obra.secretario),
      programaPpa: textoOuNulo(obra.programaPpa),
      acaoEstrategica: textoOuNulo(obra.acaoEstrategica),
      unidadeMedida: textoOuNulo(obra.unidadeMedida),
      quantidade: obra.quantidade ?? null,
    };
  }

  private montarEquipe(
    responsaveis: ObraResponsavelModel[],
  ): DadosEquipeDossie[] {
    return responsaveis
      .map((responsavel) => ({
        nome: responsavel.usuario?.name ?? '—',
        tipo: responsavel.tipo,
      }))
      .sort(
        (a, b) => a.tipo.localeCompare(b.tipo) || a.nome.localeCompare(b.nome),
      );
  }

  private montarContrato(
    contrato: ContratoModel | null,
    fontes: ContratoFonteModel[],
  ): DadosContratoDossie | null {
    if (!contrato) return null;
    return {
      numero: contrato.numero,
      objeto: textoOuNulo(contrato.objeto),
      empresaRazaoSocial: contrato.empresaContratada?.razaoSocial ?? '—',
      empresaCnpj: contrato.empresaContratada?.cnpj ?? '—',
      dataAssinatura: dia(contrato.dataAssinatura),
      dataOs: dia(contrato.dataOs) ?? '',
      fimVigencia: dia(contrato.fimVigencia),
      tipoPrazoExecucao: contrato.tipoPrazoExecucao,
      prazoExecucaoDias: contrato.prazoExecucaoDias ?? null,
      prazoExecucaoData: dia(contrato.prazoExecucaoData),
      valorInicial: somarValores(fontes).toFixed(2),
    };
  }

  private montarAditivo(
    aditivo: AditivoModel,
    fontes: AditivoFonteModel[],
  ): DadosAditivoDossie {
    return {
      numero: aditivo.numero,
      tipo: aditivo.tipo,
      dataAssinatura: dia(aditivo.dataAssinatura),
      vigenciaAditivada: dia(aditivo.vigenciaAditivada),
      prazoExecucaoDias: aditivo.prazoExecucaoDias ?? null,
      valor: somarValores(fontes).toFixed(2),
    };
  }

  private montarParalisacao(
    paralisacao: ParalisacaoModel,
  ): DadosParalisacaoDossie {
    return {
      dataParalisacao: dia(paralisacao.dataParalisacao) ?? '',
      motivo: paralisacao.motivo,
      dataReinicio: dia(paralisacao.dataReinicio),
      diasParados: paralisacao.diasParados ?? null,
    };
  }

  private montarEstagio(row: EstagioDetalheRelatorio): DadosEstagioDossie {
    return {
      descricao: String(row.nome),
      percentual: Number(row.percentual_direto ?? 0),
      dataPrazo: dia(row.data_fim),
      concluido:
        typeof row.status === 'string' && row.status.toUpperCase() === 'CONCLUIDO',
    };
  }

  private montarMedicao(row: MedicaoDetalheRelatorio): DadosMedicaoDossie {
    return {
      numero: Number(row.numero),
      dataMedicao: dia(row.data) ?? '',
      tipo: String(row.tipo),
      valor: Number(row.valor ?? 0).toFixed(2),
    };
  }

  private montarFoto(arquivo: ArquivoModel): FotoOrigemDossie {
    return {
      id: arquivo.id,
      storageKey: arquivo.storageKey,
      mimeType:
        arquivo.mimeType && arquivo.mimeType.trim() ? arquivo.mimeType : null,
      legenda:
        arquivo.descricao && arquivo.descricao.trim()
          ? arquivo.descricao
          : arquivo.nome,
      data: dia(arquivo.createdAt) ?? '',
    };
  }
}

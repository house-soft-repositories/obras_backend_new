import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import type { ObraPrivadaProps } from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import IGerarDossieObraPrivadaUseCase, {
  GerarDossieObraPrivadaParam,
} from '@/modules/obras-privadas/domain/usecase/gerar_dossie_obra_privada.usecase';
import IDetalharObraUseCase from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import { RelatorioArquivo } from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { gerarPdfSimples } from '@/modules/obras-privadas/infra/reporting/pdf_simples';
import {
  DadosAutoRelatorio,
  DadosDossie,
  DadosFiscalizacaoRelatorio,
  DadosObraRelatorio,
  enderecoCompleto,
  montarSecoesDossie,
} from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';
import type { PessoaProps } from '@/modules/pessoas/domain/entities/pessoa.entity';

export default class GerarDossieObraPrivadaService implements IGerarDossieObraPrivadaUseCase {
  constructor(
    private readonly detalharObra: IDetalharObraUseCase,
    private readonly alvaras: IAlvaraRepository,
    private readonly fiscalizacoes: IFiscalizacaoRepository,
    private readonly autos: IAutoInfracaoRepository,
    private readonly habiteSe: IHabiteSeRepository,
    private readonly observacoes: IObraPrivadaObservacaoRepository,
  ) {}

  async execute(
    param: GerarDossieObraPrivadaParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    try {
      const detalhe = await this.detalharObra.execute({
        id: param.obraPrivadaId,
      });
      if (detalhe.isLeft()) return left(detalhe.value);

      const alvaras = await this.alvaras.findByObraPrivadaId(
        param.obraPrivadaId,
      );
      if (alvaras.isLeft()) return left(alvaras.value);
      const fiscalizacoes = await this.fiscalizacoes.findByObraPrivadaId(
        param.obraPrivadaId,
      );
      if (fiscalizacoes.isLeft()) return left(fiscalizacoes.value);
      const autos = await this.autos.findByObraPrivadaId(param.obraPrivadaId);
      if (autos.isLeft()) return left(autos.value);
      const habiteSe = await this.habiteSe.findByObraPrivadaId(
        param.obraPrivadaId,
      );
      if (habiteSe.isLeft()) return left(habiteSe.value);
      const observacoes = await this.observacoes.findByObraPrivadaId(
        param.obraPrivadaId,
      );
      if (observacoes.isLeft()) return left(observacoes.value);

      const obra = this.toDadosObra(
        detalhe.value.obra.toObject(),
        detalhe.value.proprietario?.toObject(),
      );
      const dossie: DadosDossie = {
        obra,
        alvaras: alvaras.value.map((item) => item.toObject()),
        responsaveis: detalhe.value.responsaveis,
        fiscalizacoes: fiscalizacoes.value.map(
          (item) => item.toObject() as DadosFiscalizacaoRelatorio,
        ),
        autos: autos.value.map((item) => item.toObject() as DadosAutoRelatorio),
        habiteSe: habiteSe.value.map((item) => item.toObject()),
        observacoes: observacoes.value.map((item) => {
          const value = item.toObject();
          return { texto: value.texto, criadoEm: value.createdAt };
        }),
      };

      return right({
        buffer: gerarPdfSimples(
          'Dossie da Obra Privada',
          `${obra.codigo} · ${enderecoCompleto(obra)}`,
          montarSecoesDossie(dossie),
        ),
        filename: `dossie-${obra.codigo}.pdf`,
        contentType: 'application/pdf',
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

  private toDadosObra(
    obra: ObraPrivadaProps,
    proprietario: PessoaProps | undefined,
  ): DadosObraRelatorio {
    return {
      codigo: obra.codigo,
      descricao: obra.descricao,
      logradouro: obra.logradouro,
      numero: obra.numero,
      bairro: obra.bairro,
      uf: obra.uf,
      inscricaoImobiliaria: obra.inscricaoImobiliaria,
      matriculaRgi: obra.matriculaRgi,
      latitude: obra.latitude,
      longitude: obra.longitude,
      situacaoAlvara: obra.situacaoAlvara,
      andamento: obra.andamento,
      habiteSe: obra.habiteSe,
      proprietarioNome: proprietario?.nome ?? '—',
      proprietarioDocumento: proprietario?.documento ?? '—',
    };
  }
}

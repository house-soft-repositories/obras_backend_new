import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import IGerarRelatorioFiscalizacaoPrivadaUseCase, {
  GerarRelatorioFiscalizacaoPrivadaParam,
} from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_fiscalizacao_privada.usecase';
import { RelatorioArquivo } from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { gerarPdfSimples } from '@/modules/obras-privadas/infra/reporting/pdf_simples';
import {
  DadosAutoRelatorio,
  DadosFiscalizacaoRelatorio,
  DadosObraRelatorio,
  enderecoCompleto,
  montarSecoesFiscalizacao,
} from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';

export default class GerarRelatorioFiscalizacaoPrivadaService implements IGerarRelatorioFiscalizacaoPrivadaUseCase {
  constructor(
    private readonly fiscalizacoes: IFiscalizacaoRepository,
    private readonly obras: IObraPrivadaRepository,
    private readonly pessoas: IPessoaRepository,
    private readonly autos: IAutoInfracaoRepository,
  ) {}

  async execute(
    param: GerarRelatorioFiscalizacaoPrivadaParam,
  ): AsyncResult<AppException, RelatorioArquivo> {
    try {
      const fiscalizacao = await this.fiscalizacoes.findById(
        param.fiscalizacaoId,
      );
      if (fiscalizacao.isLeft()) return left(fiscalizacao.value);
      if (!fiscalizacao.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.FISCALIZACAO_NOT_FOUND,
            statusCode: 404,
          }),
        );

      const fiscalizacaoProps = fiscalizacao.value.toObject();
      const obra = await this.obras.findById(fiscalizacaoProps.obraPrivadaId);
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value || obra.value.toObject().deletedAt)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );

      const obraProps = obra.value.toObject();
      const proprietario = await this.pessoas.findById(
        obraProps.proprietarioPessoaId,
      );
      if (proprietario.isLeft()) return left(proprietario.value);
      const autos = await this.autos.findByObraPrivadaId(obraProps.id);
      if (autos.isLeft()) return left(autos.value);
      const autosDaFiscalizacao = autos.value
        .map((item) => item.toObject() as DadosAutoRelatorio)
        .filter((item) => item.fiscalizacaoId === fiscalizacaoProps.id);
      const dadosObra: DadosObraRelatorio = {
        codigo: obraProps.codigo,
        descricao: obraProps.descricao,
        logradouro: obraProps.logradouro,
        numero: obraProps.numero,
        bairro: obraProps.bairro,
        uf: obraProps.uf,
        inscricaoImobiliaria: obraProps.inscricaoImobiliaria,
        matriculaRgi: obraProps.matriculaRgi,
        latitude: obraProps.latitude,
        longitude: obraProps.longitude,
        situacaoAlvara: obraProps.situacaoAlvara,
        andamento: obraProps.andamento,
        habiteSe: obraProps.habiteSe,
        proprietarioNome: proprietario.value?.nome ?? '—',
        proprietarioDocumento: proprietario.value?.documento ?? '—',
      };

      return right({
        buffer: gerarPdfSimples(
          'Relatorio de Fiscalizacao',
          `${fiscalizacaoProps.numero} · ${enderecoCompleto(dadosObra)}`,
          montarSecoesFiscalizacao(
            dadosObra,
            fiscalizacaoProps as DadosFiscalizacaoRelatorio,
            autosDaFiscalizacao,
          ),
        ),
        filename: `fiscalizacao-${fiscalizacaoProps.numero}.pdf`,
        contentType: 'application/pdf',
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.FISCALIZACAO_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

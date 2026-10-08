import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import IHabiteSeRepository from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import IObraPrivadaObservacaoRepository from '@/modules/obras-privadas/adapters/obra_privada_observacao_repository.interface';
import IGerarDossieObraPrivadaUseCase, {
  GerarDossieObraPrivadaParam,
} from '@/modules/obras-privadas/domain/usecase/gerar_dossie_obra_privada.usecase';
import IDetalharObraUseCase from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import { RelatorioArquivo } from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { gerarPdfSimples } from '@/modules/obras-privadas/infra/reporting/pdf_simples';
import {
  enderecoCompleto,
  montarSecoesDossie,
} from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';
import DossieObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/dossie_obra_privada.entity';

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

      const obra = detalhe.value.obra.toObject();
      const dossie = DossieObraPrivadaEntity.montar({
        obra,
        proprietario: detalhe.value.proprietario?.toObject() ?? null,
        alvaras: alvaras.value.map((item) => item.toObject()),
        responsaveis: detalhe.value.responsaveis,
        fiscalizacoes: fiscalizacoes.value.map((item) => item.toObject()),
        autos: autos.value.map((item) => item.toObject()),
        habiteSe: habiteSe.value.map((item) => item.toObject()),
        observacoes: observacoes.value.map((item) => {
          const value = item.toObject();
          return { texto: value.texto, criadoEm: value.createdAt };
        }),
      }).toObject();

      return right({
        buffer: gerarPdfSimples(
          'Dossie da Obra Privada',
          `${dossie.obra.codigo} · ${enderecoCompleto(dossie.obra)}`,
          montarSecoesDossie(dossie),
        ),
        filename: `dossie-${dossie.obra.codigo}.pdf`,
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
}

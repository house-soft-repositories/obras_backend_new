import UseCase from '@/core/types/use_case';
import { RelatorioArquivo } from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';

export type GerarDossieObraPrivadaParam = { obraPrivadaId: string };

type IGerarDossieObraPrivadaUseCase = UseCase<
  GerarDossieObraPrivadaParam,
  RelatorioArquivo
>;
export default IGerarDossieObraPrivadaUseCase;

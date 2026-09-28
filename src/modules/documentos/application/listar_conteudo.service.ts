import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import IListarConteudoUseCase, {
  ConteudoPasta,
  ListarConteudoParam,
  TrilhaItem,
} from '@/modules/documentos/domain/usecase/listar_conteudo.usecase';
import PastaRepositoryException from '@/modules/documentos/exceptions/pasta_repository.exception';

export default class ListarConteudoService implements IListarConteudoUseCase {
  constructor(
    private readonly pastas: IPastaRepository,
    private readonly arquivos: IArquivoRepository,
  ) {}

  async execute(
    param: ListarConteudoParam,
  ): AsyncResult<AppException, ConteudoPasta> {
    try {
      const found = await this.pastas.findById(param.pastaId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new PastaRepositoryException({
            code: ErrorCodeConstants.PASTA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const pasta = found.value;
      const subpastas = await this.pastas.findChildren(pasta.id);
      if (subpastas.isLeft()) return left(subpastas.value);
      const total = await this.arquivos.countByPastaId(pasta.id);
      if (total.isLeft()) return left(total.value);
      const itens = await this.arquivos.findByPastaId(
        pasta.id,
        param.pageOptions.take,
        param.pageOptions.skip,
        param.pageOptions.order,
      );
      if (itens.isLeft()) return left(itens.value);
      const trilha = await this.montarTrilha(pasta.id);
      if (trilha.isLeft()) return left(trilha.value);
      const meta = new PageMetaEntity({
        pageOptions: param.pageOptions,
        itemCount: total.value,
      });
      return right({
        pasta,
        trilha: trilha.value,
        subpastas: subpastas.value,
        arquivos: new PageEntity(itens.value, meta),
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new PastaRepositoryException({
          code: ErrorCodeConstants.PASTA_REPOSITORY_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }

  private async montarTrilha(
    pastaId: string,
  ): AsyncResult<AppException, TrilhaItem[]> {
    const trilha: TrilhaItem[] = [];
    const visitados = new Set<string>();
    let atualId: string | null = pastaId;
    while (atualId && !visitados.has(atualId)) {
      visitados.add(atualId);
      const found = await this.pastas.findById(atualId);
      if (found.isLeft()) return left(found.value);
      if (!found.value) break;
      trilha.unshift({ id: found.value.id, nome: found.value.nome });
      atualId = found.value.pastaPaiId;
    }
    return right(trilha);
  }
}

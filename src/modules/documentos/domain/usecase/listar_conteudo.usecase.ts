import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type UseCase from '@/core/types/use_case';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';

export interface TrilhaItem {
  id: string;
  nome: string;
}

export interface ConteudoPasta {
  pasta: PastaEntity;
  trilha: TrilhaItem[];
  subpastas: PastaEntity[];
  arquivos: PageEntity<ArquivoEntity>;
}

export interface ListarConteudoParam {
  pastaId: string;
  pageOptions: PageOptionsEntity;
}

type IListarConteudoUseCase = UseCase<ListarConteudoParam, ConteudoPasta>;
export default IListarConteudoUseCase;

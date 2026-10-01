import UseCase from '@/core/types/use_case';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type ListarArquivosParam = {
  obraPrivadaId: string;
  vinculo?: VinculoArquivoPrivado;
  vinculoId?: string;
  categoria?: CategoriaArquivoPrivado;
};

type IListarArquivosUseCase = UseCase<
  ListarArquivosParam,
  ObraPrivadaArquivoEntity[]
>;
export default IListarArquivosUseCase;

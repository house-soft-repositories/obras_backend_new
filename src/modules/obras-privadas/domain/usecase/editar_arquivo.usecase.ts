import UseCase from '@/core/types/use_case';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import { CategoriaArquivoPrivado } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type EditarArquivoParam = {
  id: string;
  nome?: string;
  descricao?: string | null;
  ordem?: number;
  categoria?: CategoriaArquivoPrivado;
};

type IEditarArquivoUseCase = UseCase<EditarArquivoParam, ObraPrivadaArquivoEntity>;
export default IEditarArquivoUseCase;

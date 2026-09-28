import type UseCase from '@/core/types/use_case';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';

export interface CriarPastaParam {
  pastaPaiId: string;
  nome: string;
  usuarioId: string;
}

type ICriarPastaUseCase = UseCase<CriarPastaParam, PastaEntity>;
export default ICriarPastaUseCase;

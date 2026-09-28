import type UseCase from '@/core/types/use_case';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';

export interface GarantirPastaRaizParam {
  obraId: string;
}

type IGarantirPastaRaizUseCase = UseCase<GarantirPastaRaizParam, PastaEntity>;
export default IGarantirPastaRaizUseCase;

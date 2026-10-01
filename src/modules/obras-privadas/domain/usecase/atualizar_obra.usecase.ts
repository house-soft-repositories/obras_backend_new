import UseCase from '@/core/types/use_case';
import ObraPrivadaEntity, {
  ObraPrivadaUpdate,
} from '@/modules/obras-privadas/domain/entities/obra_privada.entity';

export type AtualizarObraParam = ObraPrivadaUpdate & { id: string };

type IAtualizarObraUseCase = UseCase<AtualizarObraParam, ObraPrivadaEntity>;
export default IAtualizarObraUseCase;

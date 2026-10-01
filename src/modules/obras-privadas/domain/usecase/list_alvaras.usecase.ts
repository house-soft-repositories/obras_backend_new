import UseCase from '@/core/types/use_case';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';

export type ListAlvarasParam = { obraPrivadaId: string };

type IListAlvarasUseCase = UseCase<ListAlvarasParam, AlvaraEntity[]>;
export default IListAlvarasUseCase;

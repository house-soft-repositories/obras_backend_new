import UseCase from '@/core/types/use_case';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
export type ListHabiteSeParam = { obraPrivadaId: string };
type IListHabiteSeUseCase = UseCase<ListHabiteSeParam, HabiteSeEntity[]>;
export default IListHabiteSeUseCase;

import UseCase from '@/core/types/use_case';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import { CreateHabiteSeParam } from '@/modules/obras-privadas/domain/usecase/create_habite_se.usecase';
export type UpdateHabiteSeParam = { id: string } & Partial<
  Omit<CreateHabiteSeParam, 'tenantId' | 'obraPrivadaId'>
>;
type IUpdateHabiteSeUseCase = UseCase<UpdateHabiteSeParam, HabiteSeEntity>;
export default IUpdateHabiteSeUseCase;

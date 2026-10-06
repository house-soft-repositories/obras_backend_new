import UseCase from '@/core/types/use_case';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import { CreateAlvaraParam } from '@/modules/obras-privadas/domain/usecase/create_alvara.usecase';

export type UpdateAlvaraParam = { id: string } & Partial<
  Omit<CreateAlvaraParam, 'tenantId' | 'obraPrivadaId' | 'arquivo' | 'usuarioId'>
>;

type IUpdateAlvaraUseCase = UseCase<UpdateAlvaraParam, AlvaraEntity>;
export default IUpdateAlvaraUseCase;

import MeReadModel from '@/modules/auth/domain/read_models/me.read_model';
import UseCase from '@/core/types/use_case';

type IGetMeUseCase = UseCase<string, MeReadModel>;

export default IGetMeUseCase;

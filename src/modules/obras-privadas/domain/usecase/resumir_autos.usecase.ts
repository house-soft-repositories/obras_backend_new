import UseCase from '@/core/types/use_case';

export type ResumirAutosParam = Record<string, never>;

type IResumirAutosUseCase = UseCase<ResumirAutosParam, Record<string, number>>;
export default IResumirAutosUseCase;

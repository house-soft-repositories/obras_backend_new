import AppException from '@/core/exceptions/app_exception';
import { Either } from '@/core/types/either';

type AsyncResult<L extends AppException, R> = Promise<Either<L, R>>;

export default AsyncResult;

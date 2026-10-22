import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';

export default interface UseCase<P, R> {
  execute(param: P): AsyncResult<AppException, R>;
}

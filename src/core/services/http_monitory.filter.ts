import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import type IMonitoryService from '@/core/services/monitory.service';
import ConfigurationService from '@/core/services/configuration.service';
import NODE_ENV from '@/core/types/node_env';
import { MONITORY_SERVICE } from '@/core/services/symbols';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

@Catch()
export default class HttpMonitoryFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  constructor(
    @Inject(MONITORY_SERVICE)
    private readonly monitoryService: IMonitoryService,
    httpAdapterHost: HttpAdapterHost,
    @Inject(ConfigurationService)
    private readonly configurationService: ConfigurationService,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const environment = this.configurationService.get('NODE_ENV');
    const shouldCapture =
      statusCode >= 500 ||
      (statusCode >= 400 &&
        (environment === NODE_ENV.DEV || environment === NODE_ENV.TST));

    if (shouldCapture) {
      const error =
        exception instanceof Error ? exception : new Error(String(exception));
      const cause =
        exception instanceof HttpException || exception instanceof AppException
          ? exception.cause
          : undefined;

      try {
        this.monitoryService.captureException(error, {
          method: request.method,
          path: request.url,
          statusCode,
          stackTrace: error.stack,
          cause,
          causeStackTrace: cause instanceof Error ? cause.stack : undefined,
        });
      } catch (monitoringError) {
        void monitoringError;
      }
    }
    const responseException =
      exception instanceof HttpException || exception instanceof AppException
        ? exception
        : new HttpException(ErrorCodeConstants.UNEXPECTED_ERROR, 500);

    super.catch(responseException, host);
  }
}

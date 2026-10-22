import { HttpException, HttpStatus } from '@nestjs/common';
import type { HttpServer } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core/helpers/http-adapter-host';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import HttpMonitoryFilter from '@/core/services/http_monitory.filter';
import type IMonitoryService from '@/core/services/monitory.service';
import type ConfigurationService from '@/core/services/configuration.service';
import NODE_ENV from '@/core/types/node_env';

const createHost = (request: Record<string, string>) => {
  const response = {};
  return {
    response,
    host: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getArgByIndex: (index: number) => (index === 1 ? response : request),
    },
  };
};

describe('HttpMonitoryFilter', () => {
  let filter: HttpMonitoryFilter;
  let monitoryService: jest.Mocked<IMonitoryService>;
  let configurationService: jest.Mocked<ConfigurationService>;
  let reply: jest.Mock;
  let end: jest.Mock;

  beforeEach(() => {
    monitoryService = {
      captureException: jest.fn(),
    } as unknown as jest.Mocked<IMonitoryService>;
    configurationService = {
      get: jest.fn().mockReturnValue(NODE_ENV.PRD),
    } as unknown as jest.Mocked<ConfigurationService>;
    reply = jest.fn();
    end = jest.fn();
    const httpAdapter = {
      isHeadersSent: jest.fn().mockReturnValue(false),
      reply,
      end,
    } as unknown as HttpServer;
    filter = new HttpMonitoryFilter(
      monitoryService,
      {
        httpAdapter,
      } as HttpAdapterHost,
      configurationService,
    );
  });

  it('preserves a string HttpException body through the Nest adapter', () => {
    const { host, response } = createHost({
      method: 'GET',
      url: '/resource',
    });
    const exception = new HttpException(
      'invalid request',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      { statusCode: HttpStatus.BAD_REQUEST, message: 'invalid request' },
      HttpStatus.BAD_REQUEST,
    );
    expect(monitoryService.captureException).not.toHaveBeenCalled();
  });

  it('preserves an object HttpException body without replacing it', () => {
    const { host, response } = createHost({
      method: 'POST',
      url: '/resource',
    });
    const body = {
      code: 'RESOURCE_INVALID',
      message: 'invalid request',
      details: ['name'],
    };
    const exception = new HttpException(body, HttpStatus.UNPROCESSABLE_ENTITY);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      body,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it.each([
    [NODE_ENV.DEV, HttpStatus.BAD_REQUEST],
    [NODE_ENV.TST, HttpStatus.UNAUTHORIZED],
  ])('captures client errors in %s environment', (environment, statusCode) => {
    const { host, response } = createHost({
      method: 'GET',
      url: '/resource',
    });
    const exception = new HttpException('request failed', statusCode);
    configurationService.get.mockReturnValue(environment);

    filter.catch(exception, host);

    expect(monitoryService.captureException).toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith(
      response,
      { statusCode, message: 'request failed' },
      statusCode,
    );
  });

  it('does not capture client errors in production', () => {
    const { host } = createHost({ method: 'GET', url: '/resource' });
    const exception = new HttpException(
      'request failed',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(monitoryService.captureException).not.toHaveBeenCalled();
  });

  it('captures server errors and still delegates response formatting to Nest', () => {
    const { host, response } = createHost({
      method: 'GET',
      url: '/resource',
    });
    const exception = new HttpException(
      { code: 'CRONOGRAMA_REPOSITORY_FAILED', message: 'repository failed' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, host);

    expect(monitoryService.captureException).toHaveBeenCalledWith(
      exception,
      expect.objectContaining({
        method: 'GET',
        path: '/resource',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        cause: exception.cause,
      }),
    );
    expect(reply).toHaveBeenCalledWith(
      response,
      exception.getResponse(),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('preserves the response when monitoring itself fails', () => {
    const { host, response } = createHost({
      method: 'GET',
      url: '/resource',
    });
    const exception = new HttpException(
      'repository failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    monitoryService.captureException.mockImplementation(() => {
      throw new Error('monitoring unavailable');
    });

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'repository failed',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('ends the response when headers have already been sent', () => {
    const { host, response } = createHost({
      method: 'GET',
      url: '/resource',
    });
    const exception = new HttpException(
      'repository failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const httpAdapter = {
      isHeadersSent: jest.fn().mockReturnValue(true),
      reply,
      end,
    } as unknown as HttpServer;
    filter = new HttpMonitoryFilter(
      monitoryService,
      {
        httpAdapter,
      } as HttpAdapterHost,
      configurationService,
    );

    filter.catch(exception, host);

    expect(end).toHaveBeenCalledWith(response);
    expect(reply).not.toHaveBeenCalled();
  });

  it('uses Nest generic body for an ordinary Error', () => {
    const { host, response } = createHost({
      method: 'GET',
      url: '/resource',
    });
    const exception = new Error('unexpected failure');

    filter.catch(exception, host);

    expect(monitoryService.captureException).toHaveBeenCalledWith(
      exception,
      expect.objectContaining({
        method: 'GET',
        path: '/resource',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
    );
    expect(reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ErrorCodeConstants.UNEXPECTED_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});

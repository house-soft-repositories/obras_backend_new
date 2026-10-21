import { Logger } from '@nestjs/common';
import LocalMonitoryService from '@/core/services/local_monitory.service';

describe('LocalMonitoryService', () => {
  let service: LocalMonitoryService;
  let loggerError: jest.SpiedFunction<Logger['error']>;
  let loggerWarn: jest.SpiedFunction<Logger['warn']>;
  let loggerDebug: jest.SpiedFunction<Logger['debug']>;
  let loggerLog: jest.SpiedFunction<Logger['log']>;

  beforeEach(() => {
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    loggerWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerDebug = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    loggerLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    service = new LocalMonitoryService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captures exceptions with stack and serialized context', () => {
    const exception = new Error('database failure');
    const context = { requestId: 'request-1', statusCode: 500 };

    service.captureException(exception, context);

    expect(loggerError).toHaveBeenCalledWith(
      'database failure',
      exception.stack,
      JSON.stringify(context),
    );
  });

  it.each([
    ['error', 'error'],
    ['warning', 'warn'],
    ['debug', 'debug'],
  ] as const)('routes %s messages to Logger.%s', (level, method) => {
    service.captureMessage('message', level, { source: 'test' });

    expect({ error: loggerError, warn: loggerWarn, debug: loggerDebug }[method])
      .toHaveBeenCalledWith('message', JSON.stringify({ source: 'test' }));
    expect(loggerLog).not.toHaveBeenCalled();
  });

  it('routes info messages to Logger.log', () => {
    service.captureMessage('message', 'info', { source: 'test' });

    expect(loggerLog).toHaveBeenCalledWith(
      'message',
      JSON.stringify({ source: 'test' }),
    );
  });

  it('records context, user and tags as serialized log messages', () => {
    service.setContext({ tenantId: 'tenant-1' });
    service.setUser({ id: 'user-1', email: 'user@example.com' });
    service.setTag('feature', 'cronograma');

    expect(loggerLog).toHaveBeenNthCalledWith(
      1,
      'Monitoring context: {"tenantId":"tenant-1"}',
    );
    expect(loggerLog).toHaveBeenNthCalledWith(
      2,
      'Monitoring user: {"id":"user-1","email":"user@example.com"}',
    );
    expect(loggerLog).toHaveBeenNthCalledWith(
      3,
      'Monitoring tag: feature=cronograma',
    );
  });

  it('records event start and success', () => {
    const event = { jobId: 'job-1', name: 'sync' };

    service.trackEventStart(event);
    service.trackEventSuccess(event);

    expect(loggerLog).toHaveBeenNthCalledWith(
      1,
      `Event started: ${JSON.stringify(event)}`,
    );
    expect(loggerLog).toHaveBeenNthCalledWith(
      2,
      `Event succeeded: ${JSON.stringify(event)}`,
    );
  });

  it('records event failures using the stack when available', () => {
    const event = { jobId: 'job-1', name: 'sync' };
    const error = new Error('sync failed');

    service.trackEventFailure(event, error);

    expect(loggerError).toHaveBeenCalledWith(
      `Event failed: ${JSON.stringify(event)}`,
      error.stack,
    );
  });

  it('falls back to the error message when a failure has no stack', () => {
    const event = { jobId: 'job-1', name: 'sync' };
    const error = new Error('sync failed');
    Object.defineProperty(error, 'stack', { value: undefined });

    service.trackEventFailure(event, error);

    expect(loggerError).toHaveBeenCalledWith(
      `Event failed: ${JSON.stringify(event)}`,
      'sync failed',
    );
  });
});

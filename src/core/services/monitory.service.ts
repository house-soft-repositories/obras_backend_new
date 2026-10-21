export default interface IMonitoryService {
  captureException(
    exception: Error,
    context: Record<string, unknown>,
  ): void;

  captureMessage(
    message: string,
    level: 'error' | 'warning' | 'info' | 'debug',
    context: Record<string, unknown>,
  ): void;

  setContext(context: Record<string, unknown>): void;

  setUser(user: { id: string; email: string }): void;

  setTag(key: string, value: string): void;

  /** Track start of an event/job */
  trackEventStart(event: { jobId: string; name: string }): void;

  /** Track successful completion of an event/job */
  trackEventSuccess(event: { jobId: string; name: string }): void;

  /** Track failure of an event/job */
  trackEventFailure(event: { jobId: string; name: string }, error: Error): void;
}

import { Injectable, Logger } from '@nestjs/common';
import IMonitoryService from '@/core/services/monitory.service';

@Injectable()
export default class LocalMonitoryService implements IMonitoryService {
  private readonly logger = new Logger(LocalMonitoryService.name);

  captureException(exception: Error, context: Record<string, unknown>): void {
    this.logger.error(
      exception.message,
      exception.stack,
      this.serialize(context),
    );
  }

  captureMessage(
    message: string,
    level: 'error' | 'warning' | 'info' | 'debug',
    context: Record<string, unknown>,
  ): void {
    const serializedContext = this.serialize(context);

    switch (level) {
      case 'error':
        this.logger.error(message, serializedContext);
        break;
      case 'warning':
        this.logger.warn(message, serializedContext);
        break;
      case 'debug':
        this.logger.debug(message, serializedContext);
        break;
      default:
        this.logger.log(message, serializedContext);
    }
  }

  setContext(context: Record<string, unknown>): void {
    this.logger.log(`Monitoring context: ${this.serialize(context)}`);
  }

  setUser(user: { id: string; email: string }): void {
    this.logger.log(`Monitoring user: ${this.serialize(user)}`);
  }

  setTag(key: string, value: string): void {
    this.logger.log(`Monitoring tag: ${key}=${value}`);
  }

  trackEventStart(event: { jobId: string; name: string }): void {
    this.logger.log(`Event started: ${this.serialize(event)}`);
  }

  trackEventSuccess(event: { jobId: string; name: string }): void {
    this.logger.log(`Event succeeded: ${this.serialize(event)}`);
  }

  trackEventFailure(
    event: { jobId: string; name: string },
    error: Error,
  ): void {
    this.logger.error(
      `Event failed: ${this.serialize(event)}`,
      error.stack ?? error.message,
    );
  }

  private serialize(value: Record<string, unknown>): string {
    return JSON.stringify(value);
  }
}

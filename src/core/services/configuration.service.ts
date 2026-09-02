import EnvironmentVariables from '@/core/config/enviroment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export default class ConfigurationService {
  constructor(
    private readonly configurationService: ConfigService<
      EnvironmentVariables,
      true
    >,
  ) {}

  get<T extends keyof EnvironmentVariables>(key: T): EnvironmentVariables[T] {
    return this.configurationService.get(key, {
      infer: true,
    });
  }
}

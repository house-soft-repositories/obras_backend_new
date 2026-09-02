import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import ConfigurationService from '@/core/services/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configurationService = app.get(ConfigurationService)

  await app.listen(configurationService.get('PORT'));
}
void bootstrap();

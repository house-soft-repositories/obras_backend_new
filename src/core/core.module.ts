import { Module } from "@nestjs/common";
import ConfigurationService from "@/core/services/configuration.service";
import { validateEnvironmentVariables } from "@/core/config/enviroment.validation";
import { ConfigModule } from "@nestjs/config";

@Module({
   imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validate: validateEnvironmentVariables,
    }),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export default class CoreModule {
  constructor() {
    
  }
}
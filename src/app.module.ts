import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import CoreModule from '@/core/core.module';
import TenancyModule from '@/modules/tenancy/tenancy.module';
import UsersModule from '@/modules/users/users.module';
import AuthModule from '@/modules/auth/auth.module';
import LocalidadesModule from '@/modules/localidades/localidades.module';
import OrgaosModule from '@/modules/orgaos/orgaos.module';

@Module({
  imports: [
    CoreModule,
    TenancyModule,
    UsersModule,
    AuthModule,
    LocalidadesModule,
    OrgaosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

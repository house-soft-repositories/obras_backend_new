import { Controller, Get, HttpException, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import VisaoFisicoFinanceiraService from '@/modules/obras/application/visao_fisico_financeira.service';
import { VISAO_FISICO_FINANCEIRA_SERVICE } from '@/modules/obras/symbols';

@Controller('api/obras/:id/visao-fisico-financeira')
@UseGuards(AccessTokenGuard)
export default class VisaoFisicoFinanceiraController {
  constructor(
    @Inject(VISAO_FISICO_FINANCEIRA_SERVICE) private readonly svc: VisaoFisicoFinanceiraService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Get()
  async get(@Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u: AccessTokenPayload | undefined) {
    return this.tc.run(u, async () => {
      const r = await this.svc.get(id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value;
    });
  }
}

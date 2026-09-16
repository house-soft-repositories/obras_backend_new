import { Body, Controller, Delete, Get, HttpException, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import EmpenhosService from '@/modules/obras/application/empenhos.service';
import { AtualizarEmpenhoDto, CriarEmpenhoDto } from '@/modules/obras/dtos/empenho.dto';
import { EMPENHOS_SERVICE } from '@/modules/obras/symbols';

@Controller('api/obras/:id/empenhos')
@UseGuards(AccessTokenGuard)
export default class EmpenhosController {
  constructor(
    @Inject(EMPENHOS_SERVICE) private readonly svc: EmpenhosService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: CriarEmpenhoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.create({ ...b, obraId: id });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Get()
  async list(@Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u: AccessTokenPayload | undefined) {
    return this.tc.run(u, async () => {
      const r = await this.svc.list(id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Get(':empenhoId')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('empenhoId', ParseUUIDPipe) empenhoId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.get(id, empenhoId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Patch(':empenhoId')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('empenhoId', ParseUUIDPipe) empenhoId: string,
    @Body() b: AtualizarEmpenhoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.update({ id: empenhoId, obraId: id, patch: b });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete(':empenhoId')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('empenhoId', ParseUUIDPipe) empenhoId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.remove(id, empenhoId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }
}

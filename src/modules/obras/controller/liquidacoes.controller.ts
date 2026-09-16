import { Body, Controller, Delete, Get, HttpException, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import LiquidacoesService from '@/modules/obras/application/liquidacoes.service';
import { AtualizarLiquidacaoDto, CriarLiquidacaoDto } from '@/modules/obras/dtos/liquidacao.dto';
import { LIQUIDACOES_SERVICE } from '@/modules/obras/symbols';

@Controller('api/obras/:id/liquidacoes')
@UseGuards(AccessTokenGuard)
export default class LiquidacoesController {
  constructor(
    @Inject(LIQUIDACOES_SERVICE) private readonly svc: LiquidacoesService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: CriarLiquidacaoDto,
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

  @Get(':liquidacaoId')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('liquidacaoId', ParseUUIDPipe) liquidacaoId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.get(id, liquidacaoId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Patch(':liquidacaoId')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('liquidacaoId', ParseUUIDPipe) liquidacaoId: string,
    @Body() b: AtualizarLiquidacaoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.update({ id: liquidacaoId, obraId: id, patch: b });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete(':liquidacaoId')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('liquidacaoId', ParseUUIDPipe) liquidacaoId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.remove(id, liquidacaoId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }
}

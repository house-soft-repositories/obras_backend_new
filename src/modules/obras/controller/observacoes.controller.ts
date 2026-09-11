import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import ObservacoesService from '@/modules/obras/application/observacoes.service';
import { OBSERVACOES_SERVICE } from '@/modules/obras/symbols';
import { Inject } from '@nestjs/common';
import { AtualizarObservacaoDto, CriarObservacaoDto } from '@/modules/obras/dtos/observacao.dto';
import { Body, Controller, Delete, Get, HttpException, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';

@Controller('api/obras/:id/observacoes')
@UseGuards(AccessTokenGuard)
export default class ObservacoesController {
  constructor(
    @Inject(OBSERVACOES_SERVICE) private readonly svc: ObservacoesService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: CriarObservacaoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const autor = (u as unknown as { sub: string })?.sub ?? (u as unknown as { id: string })?.id ?? '';
      const r = await this.svc.create({ obraId: id, texto: b.texto, autorUsuarioId: autor });
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

  @Patch(':obsId')
  async update(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('obsId', ParseUUIDPipe) obsId: string,
    @Body() b: AtualizarObservacaoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.update({ id: obsId, texto: b.texto });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete(':obsId')
  async remove(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('obsId', ParseUUIDPipe) obsId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.remove(obsId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }
}
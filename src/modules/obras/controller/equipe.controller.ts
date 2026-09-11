import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import EquipeService from '@/modules/obras/application/equipe.service';
import { EQUIPE_SERVICE } from '@/modules/obras/symbols';
import { Inject } from '@nestjs/common';
import { AddMembroDto, SeguirdorDto } from '@/modules/obras/dtos/equipe.dto';
import { Body, Controller, Delete, Get, HttpException, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

@Controller('api/obras/:id/equipe')
@UseGuards(AccessTokenGuard)
export default class EquipeController {
  constructor(
    @Inject(EQUIPE_SERVICE) private readonly equipe: EquipeService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post('responsaveis')
  async addResp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AddMembroDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.equipe.addResponsavel({ obraId: id, usuarioId: b.usuarioId, tipo: b.tipo });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Delete('responsaveis/:usuarioId')
  async remResp(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.equipe.removeResponsavel({ obraId: id, usuarioId });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Get('responsaveis')
  async listResp(@Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u: AccessTokenPayload | undefined) {
    return this.tc.run(u, async () => {
      const r = await this.equipe.listResponsaveis(id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value;
    });
  }

  @Post('seguidores')
  async addSeg(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: SeguirdorDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.equipe.addSeguidor({ obraId: id, usuarioId: b.usuarioId });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Delete('seguidores/:usuarioId')
  async remSeg(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.equipe.removeSeguidor({ obraId: id, usuarioId });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Get('seguidores')
  async listSeg(@Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u: AccessTokenPayload | undefined) {
    return this.tc.run(u, async () => {
      const r = await this.equipe.listSeguidores(id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value;
    });
  }
}
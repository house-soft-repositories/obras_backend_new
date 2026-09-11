import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TagsService from '@/modules/obras/application/tags.service';
import { TAGS_SERVICE } from '@/modules/obras/symbols';
import { Inject } from '@nestjs/common';
import { AplicarTagsDto } from '@/modules/obras/dtos/tags.dto';
import { Body, Controller, Delete, Get, HttpException, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

@Controller('api/obras/:id/tags')
@UseGuards(AccessTokenGuard)
export default class TagsController {
  constructor(
    @Inject(TAGS_SERVICE) private readonly tags: TagsService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Get()
  async list(@Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u: AccessTokenPayload | undefined) {
    return this.tc.run(u, async () => {
      const r = await this.tags.list(id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Post()
  async aplicar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AplicarTagsDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.tags.aplicar({ obraId: id, tags: b.tags });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Delete(':tagId')
  async detach(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.tags.detach({ obraId: id, tagId });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }
}
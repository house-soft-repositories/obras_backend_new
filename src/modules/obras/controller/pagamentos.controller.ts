import { Body, Controller, Delete, Get, HttpException, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PagamentosService from '@/modules/obras/application/pagamentos.service';
import { AtualizarPagamentoDto, CriarPagamentoDto } from '@/modules/obras/dtos/pagamento.dto';
import { PAGAMENTOS_SERVICE } from '@/modules/obras/symbols';

@Controller('api/obras/:id/pagamentos')
@UseGuards(AccessTokenGuard)
export default class PagamentosController {
  constructor(
    @Inject(PAGAMENTOS_SERVICE) private readonly svc: PagamentosService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: CriarPagamentoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.create({ ...b, obraId: id });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ...r.value.pagamento.toObject(), alerta: r.value.alerta ?? null };
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

  @Get(':pagamentoId')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pagamentoId', ParseUUIDPipe) pagamentoId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.get(id, pagamentoId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Patch(':pagamentoId')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pagamentoId', ParseUUIDPipe) pagamentoId: string,
    @Body() b: AtualizarPagamentoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.update({ id: pagamentoId, obraId: id, patch: b });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete(':pagamentoId')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pagamentoId', ParseUUIDPipe) pagamentoId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.svc.remove(id, pagamentoId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }
}

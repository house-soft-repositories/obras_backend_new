import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import GuiasService from '@/modules/obras/application/guias.service';
import { GUIAS_SERVICE } from '@/modules/obras/symbols';
import { AtualizarLicencaDto, AtualizarRecebimentoDto, CriarLocalizacaoDto, CriarOrcamentoDto, SalvarLicencaDto, SalvarRecebimentoDto, SalvarTitularidadeDto } from '@/modules/obras/dtos/guias.dto';
import { Body, Controller, Delete, Get, HttpException, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';

@Controller('api/obras/:obraId')
@UseGuards(AccessTokenGuard)
export default class GuiasController {
  constructor(@Inject(GUIAS_SERVICE) private readonly svc: GuiasService, private readonly tc: TenantRequestContextService) {}

  private run<U>(user: AccessTokenPayload | undefined, fn: () => Promise<U>): Promise<U> {
    return this.tc.run(user, fn);
  }

  @Get('localizacoes')
  async listLocalizacoes(@Param('obraId', ParseUUIDPipe) obraId: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.listLocalizacoes(obraId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Post('localizacoes')
  async createLocalizacao(@Param('obraId', ParseUUIDPipe) obraId: string, @Body() b: CriarLocalizacaoDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.createLocalizacao({ obraId, localidade: b.localidade, uf: b.uf, latitude: b.latitude ?? null, longitude: b.longitude ?? null });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete('localizacoes/:id')
  async deleteLocalizacao(@Param('obraId', ParseUUIDPipe) obraId: string, @Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.deleteLocalizacao(obraId, id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Get('orcamentos')
  async listOrcamentos(@Param('obraId', ParseUUIDPipe) obraId: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.listOrcamentos(obraId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Post('orcamentos')
  async createOrcamento(@Param('obraId', ParseUUIDPipe) obraId: string, @Body() b: CriarOrcamentoDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.createOrcamento({ obraId, fonteId: b.fonteId, valor: b.valor });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete('orcamentos/:id')
  async deleteOrcamento(@Param('obraId', ParseUUIDPipe) obraId: string, @Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.deleteOrcamento(obraId, id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Get('titularidade')
  async getTitularidade(@Param('obraId', ParseUUIDPipe) obraId: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.getTitularidade(obraId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value ? r.value.toObject() : null;
    });
  }

  @Post('titularidade')
  async upsertTitularidade(@Param('obraId', ParseUUIDPipe) obraId: string, @Body() b: SalvarTitularidadeDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.upsertTitularidade({ obraId, situacao: b.situacao, tipo: b.tipo ?? null, observacoes: b.observacoes ?? null });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Get('licencas')
  async listLicencas(@Param('obraId', ParseUUIDPipe) obraId: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.listLicencas(obraId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Post('licencas')
  async createLicenca(@Param('obraId', ParseUUIDPipe) obraId: string, @Body() b: SalvarLicencaDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.createLicenca({ obraId, situacao: b.situacao, tipo: b.tipo ?? null, numero: b.numero ?? null, validade: b.validade ?? null, observacoes: b.observacoes ?? null });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Patch('licencas/:id')
  async updateLicenca(@Param('obraId', ParseUUIDPipe) _obraId: string, @Param('id', ParseUUIDPipe) id: string, @Body() b: AtualizarLicencaDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.updateLicenca({ id, situacao: b.situacao, tipo: b.tipo, numero: b.numero, validade: b.validade, observacoes: b.observacoes });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete('licencas/:id')
  async deleteLicenca(@Param('obraId', ParseUUIDPipe) obraId: string, @Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.deleteLicenca(obraId, id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }

  @Get('recebimentos')
  async listRecebimentos(@Param('obraId', ParseUUIDPipe) obraId: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.listRecebimentos(obraId);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.map((e) => e.toObject());
    });
  }

  @Post('recebimentos')
  async createRecebimento(@Param('obraId', ParseUUIDPipe) obraId: string, @Body() b: SalvarRecebimentoDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.createRecebimento({ obraId, tipo: b.tipo, data: b.data ?? null, dataPrevista: b.dataPrevista ?? null });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Patch('recebimentos/:id')
  async updateRecebimento(@Param('obraId', ParseUUIDPipe) _obraId: string, @Param('id', ParseUUIDPipe) id: string, @Body() b: AtualizarRecebimentoDto, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.updateRecebimento({ id, tipo: b.tipo, data: b.data, dataPrevista: b.dataPrevista });
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return r.value.toObject();
    });
  }

  @Delete('recebimentos/:id')
  async deleteRecebimento(@Param('obraId', ParseUUIDPipe) obraId: string, @Param('id', ParseUUIDPipe) id: string, @AuthenticatedUser() u?: AccessTokenPayload) {
    return this.run(u, async () => {
      const r = await this.svc.deleteRecebimento(obraId, id);
      if (r.isLeft()) throw new HttpException(r.value.message, r.value.statusCode, { cause: r.value.cause });
      return { ok: true };
    });
  }
}

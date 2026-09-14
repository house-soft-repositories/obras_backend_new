import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import CriarParalisacaoDto, {
  ReinicioParalisacaoDto,
} from '@/modules/contratos/dtos/create_paralisacao.dto';
import { PARALISACOES_SERVICE } from '@/modules/contratos/symbols';
import ParalisacoesService from '@/modules/contratos/application/paralisacoes.service';
@Controller('api')
@UseGuards(AccessTokenGuard)
export default class ParalisacoesController {
  constructor(
    @Inject(PARALISACOES_SERVICE) private readonly svc: ParalisacoesService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post('contratos/:contratoId/paralisacoes')
  async create(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @Body() dto: CriarParalisacaoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.create(contratoId, {
        dataParalisacao: dto.dataParalisacao,
        motivo: dto.motivo,
        termoParalisacaoArquivoId: dto.termoParalisacaoArquivoId,
      });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return (res.value as any).toObject();
    });
  }

  @Get('contratos/:contratoId/paralisacoes')
  async list(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.list(contratoId);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.map((e: any) => (e.toObject ? e.toObject() : e));
    });
  }

  @Post('paralisacoes/:id/reinicio')
  async reinicio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReinicioParalisacaoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.reiniciar(
        id,
        dto.dataReinicio,
        dto.termoRetomadaArquivoId ?? undefined,
      );
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return (res.value as any).toObject();
    });
  }

  @Post('contratos/:contratoId/paralisacoes/:id/reinicio')
  async reinicioAninhado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReinicioParalisacaoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.reinicio(id, dto, user);
  }

  @Delete('contratos/:contratoId/paralisacoes/:id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.delete(id);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return undefined;
    });
  }
}

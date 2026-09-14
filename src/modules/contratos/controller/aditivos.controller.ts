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
import CriarAditivoDto from '@/modules/contratos/dtos/create_aditivo.dto';
import { ADITIVOS_SERVICE } from '@/modules/contratos/symbols';
import AditivosService from '@/modules/contratos/application/aditivos.service';
@Controller('api/contratos/:contratoId/aditivos')
@UseGuards(AccessTokenGuard)
export default class AditivosController {
  constructor(
    @Inject(ADITIVOS_SERVICE) private readonly svc: AditivosService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @Body() dto: CriarAditivoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.create(contratoId, {
        numero: dto.numero,
        tipo: dto.tipo,
        dataAssinatura: dto.dataAssinatura ?? null,
        tipoPrazoExecucao: dto.tipoPrazoExecucao ?? null,
        prazoExecucaoDias: dto.prazoExecucaoDias ?? null,
        prazoExecucaoData: dto.prazoExecucaoData ?? null,
        vigenciaAditivada: dto.vigenciaAditivada ?? null,
        observacoes: dto.observacoes ?? null,
      });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return (res.value as any).toObject();
    });
  }

  @Get()
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

  @Get(':id')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.get(id);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      if (!res.value) throw new HttpException('Aditivo não encontrado', 404);
      return res.value.toObject();
    });
  }

  @Delete(':id')
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

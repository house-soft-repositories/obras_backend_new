import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import CriarContratoDto from '@/modules/contratos/dtos/create_contrato.dto';
import { AtualizarContratoDto } from '@/modules/contratos/dtos/create_contrato.dto';
import {
  CREATE_CONTRATO_SERVICE,
  LIST_CONTRATOS_SERVICE,
  ADITIVOS_SERVICE,
  PARALISACOES_SERVICE,
} from '@/modules/contratos/symbols';
import ContratosService from '@/modules/contratos/application/contratos.service';
@Controller('api/contratos')
@UseGuards(AccessTokenGuard)
export default class ContratosController {
  constructor(
    @Inject(CREATE_CONTRATO_SERVICE) private readonly criar: ContratosService,
    @Inject(LIST_CONTRATOS_SERVICE) private readonly listar: ContratosService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Body() dto: CriarContratoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.criar.create({
        obraId: dto.obraId,
        empresaContratadaId: dto.empresaContratadaId,
        numero: dto.numero,
        dataOs: dto.dataOs,
        tipoPrazoExecucao: dto.tipoPrazoExecucao,
        prazoExecucaoDias: dto.prazoExecucaoDias ?? null,
        prazoExecucaoData: dto.prazoExecucaoData ?? null,
        objeto: dto.objeto ?? null,
        dataAssinatura: dto.dataAssinatura ?? null,
        fimVigencia: dto.fimVigencia ?? null,
        fontes: dto.fontes,
      });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      const e = res.value.toObject() as any;
      return e;
    });
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('take') take?: string,
    @Query('order') order?: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const pageOptions = new PageOptionsEntity(
        (order as any) ?? 'DESC',
        Number(page ?? 1),
        Number(take ?? 10),
      );
      const res = await this.listar.list(pageOptions);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return {
        data: res.value.pageData.map((e: any) =>
          e.toObject ? e.toObject() : e,
        ),
        meta: res.value.pageMeta,
      };
    });
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.listar.getById(id);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return (res.value as any).toObject();
    });
  }

  @Get(':id/prazo-final')
  async prazoFinal(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.listar.prazoFinal(id);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value;
    });
  }

  @Get(':id/valores')
  async valores(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.listar.valores(id);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value;
    });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarContratoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.criar.update(id, {
        empresaContratadaId: dto.empresaContratadaId,
        numero: dto.numero,
        objeto: dto.objeto ?? undefined,
        dataAssinatura: dto.dataAssinatura ?? undefined,
        fimVigencia: dto.fimVigencia ?? undefined,
        dataOs: dto.dataOs,
        tipoPrazoExecucao: dto.tipoPrazoExecucao,
        prazoExecucaoDias: dto.prazoExecucaoDias ?? undefined,
        prazoExecucaoData: dto.prazoExecucaoData ?? undefined,
        fontes: dto.fontes,
      });
      if (res.isLeft()) throw new HttpException(res.value.message, res.value.statusCode, { cause: res.value.cause });
      return res.value.toObject();
    });
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.criar.delete(id);
      if (res.isLeft()) throw new HttpException(res.value.message, res.value.statusCode, { cause: res.value.cause });
      return undefined;
    });
  }
}

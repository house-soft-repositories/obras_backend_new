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
  Inject,
} from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import CriarContratoDto from '@/modules/contratos/dtos/create_contrato.dto';
import { AtualizarContratoDto } from '@/modules/contratos/dtos/create_contrato.dto';
import {
  CREATE_CONTRATO_USE_CASE,
  LIST_CONTRATOS_USE_CASE,
  GET_CONTRATO_USE_CASE,
  UPDATE_CONTRATO_USE_CASE,
  DELETE_CONTRATO_USE_CASE,
  GET_PRAZO_FINAL_CONTRATO_USE_CASE,
  GET_VALORES_CONTRATO_USE_CASE,
} from '@/modules/contratos/symbols';
import type ICreateContratoUseCase from '@/modules/contratos/domain/usecase/create_contrato.usecase';
import type IListContratosUseCase from '@/modules/contratos/domain/usecase/list_contratos.usecase';
import type IGetContratoUseCase from '@/modules/contratos/domain/usecase/get_contrato.usecase';
import type IUpdateContratoUseCase from '@/modules/contratos/domain/usecase/update_contrato.usecase';
import type IDeleteContratoUseCase from '@/modules/contratos/domain/usecase/delete_contrato.usecase';
import type IGetPrazoFinalContratoUseCase from '@/modules/contratos/domain/usecase/get_prazo_final_contrato.usecase';
import type IGetValoresContratoUseCase from '@/modules/contratos/domain/usecase/get_valores_contrato.usecase';

@Controller('api/contratos')
@UseGuards(AccessTokenGuard)
export default class ContratosController {
  constructor(
    @Inject(CREATE_CONTRATO_USE_CASE)
    private readonly createContrato: ICreateContratoUseCase,
    @Inject(LIST_CONTRATOS_USE_CASE)
    private readonly listContratos: IListContratosUseCase,
    @Inject(GET_CONTRATO_USE_CASE)
    private readonly getContrato: IGetContratoUseCase,
    @Inject(UPDATE_CONTRATO_USE_CASE)
    private readonly updateContrato: IUpdateContratoUseCase,
    @Inject(DELETE_CONTRATO_USE_CASE)
    private readonly deleteContrato: IDeleteContratoUseCase,
    @Inject(GET_PRAZO_FINAL_CONTRATO_USE_CASE)
    private readonly prazoFinalContrato: IGetPrazoFinalContratoUseCase,
    @Inject(GET_VALORES_CONTRATO_USE_CASE)
    private readonly valoresContrato: IGetValoresContratoUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Body() dto: CriarContratoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.createContrato.execute({
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
      return res.value.toObject();
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
        (order as 'ASC' | 'DESC' | undefined) ?? 'DESC',
        Number(page ?? 1),
        Number(take ?? 10),
      );
      const res = await this.listContratos.execute({ pageOptions });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return {
        data: res.value.pageData.map((e) => e.toObject()),
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
      const res = await this.getContrato.execute({ id });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
    });
  }

  @Get(':id/prazo-final')
  async prazoFinal(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.prazoFinalContrato.execute({ id });
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
      const res = await this.valoresContrato.execute({ id });
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
      const res = await this.updateContrato.execute({
        id,
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
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
    });
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.deleteContrato.execute({ id });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return undefined;
    });
  }
}

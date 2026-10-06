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
  Inject,
} from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import CriarAditivoDto from '@/modules/contratos/dtos/create_aditivo.dto';
import {
  CREATE_ADITIVO_USE_CASE,
  LIST_ADITIVOS_USE_CASE,
  GET_ADITIVO_USE_CASE,
  DELETE_ADITIVO_USE_CASE,
} from '@/modules/contratos/symbols';
import type ICreateAditivoUseCase from '@/modules/contratos/domain/usecase/create_aditivo.usecase';
import type IListAditivosUseCase from '@/modules/contratos/domain/usecase/list_aditivos.usecase';
import type IGetAditivoUseCase from '@/modules/contratos/domain/usecase/get_aditivo.usecase';
import type IDeleteAditivoUseCase from '@/modules/contratos/domain/usecase/delete_aditivo.usecase';

@Controller('api/contratos/:contratoId/aditivos')
@UseGuards(AccessTokenGuard)
export default class AditivosController {
  constructor(
    @Inject(CREATE_ADITIVO_USE_CASE)
    private readonly createAditivo: ICreateAditivoUseCase,
    @Inject(LIST_ADITIVOS_USE_CASE)
    private readonly listAditivos: IListAditivosUseCase,
    @Inject(GET_ADITIVO_USE_CASE)
    private readonly getAditivo: IGetAditivoUseCase,
    @Inject(DELETE_ADITIVO_USE_CASE)
    private readonly deleteAditivo: IDeleteAditivoUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @Body() dto: CriarAditivoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.createAditivo.execute({
        contratoId,
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
      return res.value.toObject();
    });
  }

  @Get()
  async list(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.listAditivos.execute({ contratoId });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.map((e) => e.toObject());
    });
  }

  @Get(':id')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.getAditivo.execute({ id });
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
      const res = await this.deleteAditivo.execute({ id });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return undefined;
    });
  }
}

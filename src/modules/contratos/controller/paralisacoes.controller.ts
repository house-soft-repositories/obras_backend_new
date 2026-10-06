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
import CriarParalisacaoDto, {
  ReinicioParalisacaoDto,
} from '@/modules/contratos/dtos/create_paralisacao.dto';
import {
  CREATE_PARALISACAO_USE_CASE,
  LIST_PARALISACOES_USE_CASE,
  REINICIAR_PARALISACAO_USE_CASE,
  DELETE_PARALISACAO_USE_CASE,
} from '@/modules/contratos/symbols';
import type ICreateParalisacaoUseCase from '@/modules/contratos/domain/usecase/create_paralisacao.usecase';
import type IListParalisacoesUseCase from '@/modules/contratos/domain/usecase/list_paralisacoes.usecase';
import type IReiniciarParalisacaoUseCase from '@/modules/contratos/domain/usecase/reiniciar_paralisacao.usecase';
import type IDeleteParalisacaoUseCase from '@/modules/contratos/domain/usecase/delete_paralisacao.usecase';

@Controller('api')
@UseGuards(AccessTokenGuard)
export default class ParalisacoesController {
  constructor(
    @Inject(CREATE_PARALISACAO_USE_CASE)
    private readonly createParalisacao: ICreateParalisacaoUseCase,
    @Inject(LIST_PARALISACOES_USE_CASE)
    private readonly listParalisacoes: IListParalisacoesUseCase,
    @Inject(REINICIAR_PARALISACAO_USE_CASE)
    private readonly reiniciarParalisacao: IReiniciarParalisacaoUseCase,
    @Inject(DELETE_PARALISACAO_USE_CASE)
    private readonly deleteParalisacao: IDeleteParalisacaoUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post('contratos/:contratoId/paralisacoes')
  async create(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @Body() dto: CriarParalisacaoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.createParalisacao.execute({
        contratoId,
        dataParalisacao: dto.dataParalisacao,
        motivo: dto.motivo,
        termoParalisacaoArquivoId: dto.termoParalisacaoArquivoId,
      });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
    });
  }

  @Get('contratos/:contratoId/paralisacoes')
  async list(
    @Param('contratoId', ParseUUIDPipe) contratoId: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.listParalisacoes.execute({ contratoId });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.map((e) => e.toObject());
    });
  }

  @Post('paralisacoes/:id/reinicio')
  async reinicio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReinicioParalisacaoDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.reiniciarParalisacao.execute({
        id,
        dataReinicio: dto.dataReinicio,
        termoRetomadaArquivoId: dto.termoRetomadaArquivoId ?? null,
      });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
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
      const res = await this.deleteParalisacao.execute({ id });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return undefined;
    });
  }
}

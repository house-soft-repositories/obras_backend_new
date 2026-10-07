import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import DashboardRelatorioService from '@/modules/relatorios/application/dashboard_relatorio.service';
import ListarObrasRelatorioService from '@/modules/relatorios/application/listar_obras_relatorio.service';
import type IDesempenhoObraRelatorioUseCase from '@/modules/relatorios/domain/usecase/desempenho_obra_relatorio.usecase';
import type IExportarListaObrasRelatorioUseCase from '@/modules/relatorios/domain/usecase/exportar_lista_obras_relatorio.usecase';
import type IFluxoFisicoFinanceiroRelatorioUseCase from '@/modules/relatorios/domain/usecase/fluxo_fisico_financeiro_relatorio.usecase';
import type IGerarPdfObraRelatorioUseCase from '@/modules/relatorios/domain/usecase/gerar_pdf_obra_relatorio.usecase';
import type IQuantificadoresRelatorioUseCase from '@/modules/relatorios/domain/usecase/quantificadores_relatorio.usecase';
import { RelatorioArquivo } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import ExportarListaObrasDto from '@/modules/relatorios/dtos/exportar_lista_obras.dto';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import {
  DASHBOARD_RELATORIO_SERVICE,
  DESEMPENHO_OBRA_RELATORIO_SERVICE,
  EXPORTAR_LISTA_OBRAS_RELATORIO_SERVICE,
  FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE,
  GERAR_DOSSIE_OBRA_SERVICE,
  GERAR_RELATORIO_OBRA_SERVICE,
  LISTAR_OBRAS_RELATORIO_SERVICE,
  QUANTIFICADORES_RELATORIO_SERVICE,
} from '@/modules/relatorios/symbols';
import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

@Controller('api/relatorios')
@UseGuards(AccessTokenGuard)
export default class RelatoriosController {
  constructor(
    @Inject(LISTAR_OBRAS_RELATORIO_SERVICE)
    private readonly listar: ListarObrasRelatorioService,
    @Inject(QUANTIFICADORES_RELATORIO_SERVICE)
    private readonly quantificadores: IQuantificadoresRelatorioUseCase,
    @Inject(DESEMPENHO_OBRA_RELATORIO_SERVICE)
    private readonly desempenho: IDesempenhoObraRelatorioUseCase,
    @Inject(DASHBOARD_RELATORIO_SERVICE)
    private readonly dashboard: DashboardRelatorioService,
    @Inject(FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE)
    private readonly fluxo: IFluxoFisicoFinanceiroRelatorioUseCase,
    @Inject(EXPORTAR_LISTA_OBRAS_RELATORIO_SERVICE)
    private readonly exportarLista: IExportarListaObrasRelatorioUseCase,
    @Inject(GERAR_RELATORIO_OBRA_SERVICE)
    private readonly relatorioObra: IGerarPdfObraRelatorioUseCase,
    @Inject(GERAR_DOSSIE_OBRA_SERVICE)
    private readonly dossieObra: { gerarDossie(param: { usuarioId: string; obraId: string }): ReturnType<IGerarPdfObraRelatorioUseCase['execute']> },
    private readonly tc: TenantRequestContextService,
  ) {}

  @Get('quantificadores')
  async obterQuantificadores(
    @Query() filtro: FiltroObrasDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.quantificadores.execute({
        ...filtro,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get('obras')
  async listarObras(
    @Query() filtro: FiltroObrasDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.listar.execute({
        ...filtro,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get('obras/mapa')
  async listarMapa(
    @Query() filtro: FiltroObrasDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.listar.listarMapa({
        ...filtro,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get('obras/calendario')
  async listarCalendario(
    @Query() filtro: FiltroObrasDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.listar.listarCalendario({
        ...filtro,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get('obras/exportar')
  async exportar(
    @Query() filtro: ExportarListaObrasDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
    @Res() response: Response,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.exportarLista.execute({
        ...filtro,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      this.send(response, result.value);
    });
  }

  @Get('obras/:obraId/desempenho')
  async obterDesempenho(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.desempenho.execute({
        obraId,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get('obras/:obraId/relatorio.pdf')
  async relatorio(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
    @Res() response: Response,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.relatorioObra.execute({
        obraId,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      this.send(response, result.value);
    });
  }

  @Get('obras/:obraId/dossie.pdf')
  async dossie(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
    @Res() response: Response,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.dossieObra.gerarDossie({
        obraId,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      this.send(response, result.value);
    });
  }

  @Get('dashboard')
  async obterDashboard(
    @Query() filtro: FiltroObrasDto,
    @Query('orgaoId') orgaoId: string | undefined,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.dashboard.execute({
        ...filtro,
        orgaoId,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get('fluxo-fisico-financeiro')
  async obterFluxo(
    @Query() filtro: FiltroObrasDto,
    @Query('obraId') obraId: string | undefined,
    @Query('orgaoId') orgaoId: string | undefined,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.fluxo.execute({
        ...filtro,
        obraId,
        orgaoId,
        usuarioId: this.userId(user),
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  private userId(user: AccessTokenPayload | undefined): string {
    return user?.sub ?? '';
  }

  private send(response: Response, report: RelatorioArquivo): void {
    response
      .set({
        'Content-Type': report.contentType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
      })
      .send(report.buffer);
  }

  private throwHttp(error: AppException): never {
    throw new HttpException(error.message, error.statusCode, {
      cause: error.cause,
    });
  }
}

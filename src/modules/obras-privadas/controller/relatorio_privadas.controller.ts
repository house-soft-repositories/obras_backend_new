import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type IGerarDossieObraPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/gerar_dossie_obra_privada.usecase';
import type IGerarRelatorioFiscalizacaoPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_fiscalizacao_privada.usecase';
import type IGerarRelatorioListaObrasPrivadasUseCase from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import type { RelatorioArquivo } from '@/modules/obras-privadas/domain/usecase/gerar_relatorio_lista_obras_privadas.usecase';
import ExportarObrasPrivadasQueryDto from '@/modules/obras-privadas/dtos/exportar_obras_privadas_query.dto';
import {
  GERAR_DOSSIE_OBRA_PRIVADA_SERVICE,
  GERAR_RELATORIO_FISCALIZACAO_PRIVADA_SERVICE,
  GERAR_RELATORIO_LISTA_OBRAS_PRIVADAS_SERVICE,
} from '@/modules/obras-privadas/symbols';
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

@Controller('api/relatorios/obras-privadas')
@UseGuards(AccessTokenGuard)
export default class RelatorioPrivadasController {
  constructor(
    @Inject(GERAR_RELATORIO_LISTA_OBRAS_PRIVADAS_SERVICE)
    private readonly gerarLista: IGerarRelatorioListaObrasPrivadasUseCase,
    @Inject(GERAR_DOSSIE_OBRA_PRIVADA_SERVICE)
    private readonly gerarDossie: IGerarDossieObraPrivadaUseCase,
    @Inject(GERAR_RELATORIO_FISCALIZACAO_PRIVADA_SERVICE)
    private readonly gerarFiscalizacao: IGerarRelatorioFiscalizacaoPrivadaUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Get('exportar')
  async exportar(
    @Query() query: ExportarObrasPrivadasQueryDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
    @Res() response: Response,
  ) {
    return this.tc.run(user, async () => {
      const { formato, ...filters } = query;
      const result = await this.gerarLista.execute({
        ...filters,
        formato,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      this.send(response, result.value);
    });
  }

  @Get(':obraPrivadaId/dossie.pdf')
  async dossie(
    @Param('obraPrivadaId', ParseUUIDPipe) obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
    @Res() response: Response,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.gerarDossie.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      this.send(response, result.value);
    });
  }

  @Get('fiscalizacoes/:fiscalizacaoId/relatorio.pdf')
  async relatorioFiscalizacao(
    @Param('fiscalizacaoId', ParseUUIDPipe) fiscalizacaoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
    @Res() response: Response,
  ) {
    return this.tc.run(user, async () => {
      const result = await this.gerarFiscalizacao.execute({ fiscalizacaoId });
      if (result.isLeft()) this.throwHttp(result.value);
      this.send(response, result.value);
    });
  }

  private send(response: Response, report: RelatorioArquivo): void {
    response
      .set({
        'Content-Type': report.contentType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
      })
      .send(report.buffer);
  }

  private throwHttp(error: {
    message: string;
    statusCode: number;
    cause?: unknown;
  }): never {
    throw new HttpException(error.message, error.statusCode, {
      cause: error.cause,
    });
  }
}

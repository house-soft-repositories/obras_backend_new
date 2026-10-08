import CoreModule from '@/core/core.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AuthModule from '@/modules/auth/auth.module';
import DashboardRelatorioService from '@/modules/relatorios/application/dashboard_relatorio.service';
import DesempenhoObraRelatorioService from '@/modules/relatorios/application/desempenho_obra_relatorio.service';
import ExportarListaObrasRelatorioService from '@/modules/relatorios/application/exportar_lista_obras_relatorio.service';
import FluxoFisicoFinanceiroRelatorioService from '@/modules/relatorios/application/fluxo_fisico_financeiro_relatorio.service';
import GerarPdfObraRelatorioService from '@/modules/relatorios/application/gerar_pdf_obra_relatorio.service';
import ListarObrasRelatorioService from '@/modules/relatorios/application/listar_obras_relatorio.service';
import QuantificadoresRelatorioService from '@/modules/relatorios/application/quantificadores_relatorio.service';
import RelatoriosController from '@/modules/relatorios/controller/relatorios.controller';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import DossieObraRepository from '@/modules/relatorios/infra/repositories/dossie_obra.repository';
import PuppeteerPdfRenderer from '@/modules/relatorios/infra/reporting/puppeteer_pdf_renderer';
import type IDossieObraRepository from '@/modules/relatorios/adapters/dossie_obra_repository.interface';
import type IPdfRenderer from '@/modules/relatorios/adapters/pdf_renderer.interface';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import StorageModule from '@/modules/storage/storage.module';
import { STORAGE_SERVICE } from '@/modules/storage/symbols';
import {
  DASHBOARD_RELATORIO_SERVICE,
  DESEMPENHO_OBRA_RELATORIO_SERVICE,
  DOSSIE_OBRA_REPOSITORY,
  EXPORTAR_LISTA_OBRAS_RELATORIO_SERVICE,
  FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE,
  GERAR_DOSSIE_OBRA_SERVICE,
  GERAR_RELATORIO_OBRA_SERVICE,
  LISTAR_OBRAS_RELATORIO_SERVICE,
  PDF_RENDERER,
  QUANTIFICADORES_RELATORIO_SERVICE,
  RELATORIOS_QUERY,
} from '@/modules/relatorios/symbols';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Module({
  imports: [CoreModule, AuthModule, StorageModule],
  controllers: [RelatoriosController],
  providers: [
    {
      provide: RELATORIOS_QUERY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tenantContext: TenantContext) =>
        new RelatoriosQuery(ds, tenantContext),
    },
    {
      provide: LISTAR_OBRAS_RELATORIO_SERVICE,
      inject: [RELATORIOS_QUERY],
      useFactory: (query: RelatoriosQuery) =>
        new ListarObrasRelatorioService(query),
    },
    {
      provide: QUANTIFICADORES_RELATORIO_SERVICE,
      inject: [RELATORIOS_QUERY],
      useFactory: (query: RelatoriosQuery) =>
        new QuantificadoresRelatorioService(query),
    },
    {
      provide: DESEMPENHO_OBRA_RELATORIO_SERVICE,
      inject: [RELATORIOS_QUERY],
      useFactory: (query: RelatoriosQuery) =>
        new DesempenhoObraRelatorioService(query),
    },
    {
      provide: FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE,
      inject: [RELATORIOS_QUERY],
      useFactory: (query: RelatoriosQuery) =>
        new FluxoFisicoFinanceiroRelatorioService(query),
    },
    {
      provide: DASHBOARD_RELATORIO_SERVICE,
      inject: [RELATORIOS_QUERY, FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE],
      useFactory: (
        query: RelatoriosQuery,
        fluxo: FluxoFisicoFinanceiroRelatorioService,
      ) => new DashboardRelatorioService(query, fluxo),
    },
    {
      provide: EXPORTAR_LISTA_OBRAS_RELATORIO_SERVICE,
      inject: [LISTAR_OBRAS_RELATORIO_SERVICE],
      useFactory: (listar: ListarObrasRelatorioService) =>
        new ExportarListaObrasRelatorioService(listar),
    },
    {
      provide: GERAR_RELATORIO_OBRA_SERVICE,
      inject: [
        RELATORIOS_QUERY,
        FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE,
        PDF_RENDERER,
        STORAGE_SERVICE,
        DOSSIE_OBRA_REPOSITORY,
      ],
      useFactory: (
        query: RelatoriosQuery,
        fluxo: FluxoFisicoFinanceiroRelatorioService,
        renderer: IPdfRenderer,
        storage: IStorageService,
        dossie: IDossieObraRepository,
      ) => new GerarPdfObraRelatorioService(query, fluxo, renderer, storage, dossie),
    },
    {
      provide: GERAR_DOSSIE_OBRA_SERVICE,
      inject: [GERAR_RELATORIO_OBRA_SERVICE],
      useFactory: (service: GerarPdfObraRelatorioService) => service,
    },
    {
      provide: PDF_RENDERER,
      useFactory: (): IPdfRenderer => new PuppeteerPdfRenderer(),
    },
    {
      provide: DOSSIE_OBRA_REPOSITORY,
      inject: [DataSource, TenantContext, RELATORIOS_QUERY],
      useFactory: (
        ds: DataSource,
        tenantContext: TenantContext,
        query: RelatoriosQuery,
      ): IDossieObraRepository =>
        new DossieObraRepository(ds, tenantContext, query),
    },
  ],
})
export default class RelatoriosModule {}

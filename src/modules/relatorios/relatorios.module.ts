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
import {
  DASHBOARD_RELATORIO_SERVICE,
  DESEMPENHO_OBRA_RELATORIO_SERVICE,
  EXPORTAR_LISTA_OBRAS_RELATORIO_SERVICE,
  FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE,
  GERAR_DOSSIE_OBRA_SERVICE,
  GERAR_RELATORIO_OBRA_SERVICE,
  LISTAR_OBRAS_RELATORIO_SERVICE,
  QUANTIFICADORES_RELATORIO_SERVICE,
  RELATORIOS_QUERY,
} from '@/modules/relatorios/symbols';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Module({
  imports: [CoreModule, AuthModule],
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
      inject: [RELATORIOS_QUERY, FLUXO_FISICO_FINANCEIRO_RELATORIO_SERVICE],
      useFactory: (
        query: RelatoriosQuery,
        fluxo: FluxoFisicoFinanceiroRelatorioService,
      ) => new GerarPdfObraRelatorioService(query, fluxo),
    },
    {
      provide: GERAR_DOSSIE_OBRA_SERVICE,
      inject: [GERAR_RELATORIO_OBRA_SERVICE],
      useFactory: (service: GerarPdfObraRelatorioService) => service,
    },
  ],
})
export default class RelatoriosModule {}

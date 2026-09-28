import { Logger } from '@nestjs/common';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver';
import type ObraEventsService from '@/modules/obras/events/obra_events.service';
import type IDuplicarArvoreUseCase from '@/modules/documentos/domain/usecase/duplicar_arvore.usecase';

/**
 * RN-DOC-11: ao duplicar uma obra com "copiar arquivos" marcado,
 * replica a árvore documental (pastas + metadados, nova storage_key
 * por cópia de objeto). Falha aqui nunca derruba a duplicação.
 */
export default class ObraDuplicadaListener {
  private readonly logger = new Logger(ObraDuplicadaListener.name);

  constructor(
    private readonly events: ObraEventsService,
    private readonly tenantContext: TenantContext,
    private readonly resolver: TenantSchemaResolver,
    private readonly duplicar: IDuplicarArvoreUseCase,
  ) {}

  onModuleInit(): void {
    this.events.onObraDuplicada(
      ({ tenantId, origemObraId, novaObraId, copiarArquivos }) => {
        if (!copiarArquivos) return;
        void this.executar(tenantId, origemObraId, novaObraId);
      },
    );
  }

  private async executar(
    tenantId: string,
    origemObraId: string,
    novaObraId: string,
  ): Promise<void> {
    try {
      const tenant = await this.resolver.resolve(tenantId);
      if (!tenant) {
        this.logger.error(`Tenant ${tenantId} não resolvido (duplicação)`);
        return;
      }
      const result = await this.tenantContext.run(tenant, () =>
        this.duplicar.execute({
          obraOrigemId: origemObraId,
          obraDestinoId: novaObraId,
        }),
      );
      if (result.isLeft())
        this.logger.error(
          `Falha ao duplicar árvore ${origemObraId} -> ${novaObraId}: ${result.value.code}`,
        );
    } catch (error) {
      this.logger.error(
        `Falha ao duplicar árvore ${origemObraId} -> ${novaObraId}: ${String(error)}`,
      );
    }
  }
}

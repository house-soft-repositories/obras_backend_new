import { Logger } from '@nestjs/common';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver';
import type ObraEventsService from '@/modules/obras/events/obra_events.service';
import type IGarantirPastaRaizUseCase from '@/modules/documentos/domain/usecase/garantir_pasta_raiz.usecase';

/**
 * RN-DOC-01: ao criar uma obra, cria a pasta raiz do menu Arquivos.
 * Falha aqui nunca derruba a criação da obra — a raiz também é
 * garantida preguiçosamente no GET .../pastas/raiz.
 */
export default class ObraCriadaListener {
  private readonly logger = new Logger(ObraCriadaListener.name);

  constructor(
    private readonly events: ObraEventsService,
    private readonly tenantContext: TenantContext,
    private readonly resolver: TenantSchemaResolver,
    private readonly garantirRaiz: IGarantirPastaRaizUseCase,
  ) {}

  onModuleInit(): void {
    this.events.onObraCriada(({ tenantId, obraId }) => {
      void this.executar(tenantId, obraId);
    });
  }

  private async executar(tenantId: string, obraId: string): Promise<void> {
    try {
      const tenant = await this.resolver.resolve(tenantId);
      if (!tenant) {
        this.logger.error(`Tenant ${tenantId} não resolvido (pasta raiz)`);
        return;
      }
      const result = await this.tenantContext.run(tenant, () =>
        this.garantirRaiz.execute({ obraId }),
      );
      if (result.isLeft())
        this.logger.error(
          `Falha ao criar pasta raiz da obra ${obraId}: ${result.value.code}`,
        );
    } catch (error) {
      this.logger.error(
        `Falha ao criar pasta raiz da obra ${obraId}: ${String(error)}`,
      );
    }
  }
}

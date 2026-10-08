/**
 * Contrato de leitura do dossiê da obra pública para relatórios.
 * Implementação TypeORM em `infra/repositories/dossie_obra.repository.ts`.
 */
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import type { DossieObraCarregado } from '@/modules/relatorios/domain/relatorios/dossie_obra';

export default interface IDossieObraRepository {
  carregar(
    obraId: string,
  ): AsyncResult<AppException, DossieObraCarregado | null>;
}

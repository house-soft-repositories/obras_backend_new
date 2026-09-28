import { EventEmitter } from 'node:events';

export const OBRA_CRIADA = 'OBRA_CRIADA';
export const OBRA_DUPLICADA = 'OBRA_DUPLICADA';

export interface ObraCriadaPayload {
  tenantId: string;
  obraId: string;
}

export interface ObraDuplicadaPayload {
  tenantId: string;
  origemObraId: string;
  novaObraId: string;
  copiarArquivos: boolean;
}

/**
 * Barramento interno do ObrasContext (RN-OBR-19, RN-DOC-01/11).
 * O ObrasModule emite; o DocumentosModule reage via listeners,
 * sem que Obras dependa de Documentos (sem ciclo).
 */
export default class ObraEventsService {
  private readonly emitter = new EventEmitter();

  emitirObraCriada(payload: ObraCriadaPayload): void {
    this.emitter.emit(OBRA_CRIADA, payload);
  }

  emitirObraDuplicada(payload: ObraDuplicadaPayload): void {
    this.emitter.emit(OBRA_DUPLICADA, payload);
  }

  onObraCriada(handler: (payload: ObraCriadaPayload) => void): void {
    this.emitter.on(OBRA_CRIADA, handler);
  }

  onObraDuplicada(handler: (payload: ObraDuplicadaPayload) => void): void {
    this.emitter.on(OBRA_DUPLICADA, handler);
  }
}

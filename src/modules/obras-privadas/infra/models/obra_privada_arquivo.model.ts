import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'obra_privada_arquivo' })
export default class ObraPrivadaArquivoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column() vinculo: string;
  @Column({ name: 'vinculo_id', type: 'uuid', nullable: true })
  vinculoId: string | null;
  @Column() categoria: string;
  @Column() nome: string;
  @Column({ nullable: true, type: 'text' }) descricao: string | null;
  @Column({ name: 'nome_original' }) nomeOriginal: string;
  @Column({ name: 'mime_type', nullable: true, type: 'varchar' })
  mimeType: string | null;
  @Column({ name: 'tamanho_bytes', nullable: true, type: 'bigint' })
  tamanhoBytes: string | null;
  @Column({ name: 'storage_key' }) storageKey: string;
  @Column({ type: 'int', default: 0 }) ordem: number;
  @Column({ nullable: true, type: 'numeric' }) latitude: string | null;
  @Column({ nullable: true, type: 'numeric' }) longitude: string | null;
  @Column({ name: 'capturado_em', nullable: true, type: 'timestamptz' })
  capturadoEm: Date | null;
  @Column({ name: 'enviado_por_usuario_id', type: 'uuid' })
  enviadoPorUsuarioId: string;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
}

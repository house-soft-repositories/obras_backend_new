import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'arquivo' })
export default class ArquivoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'obra_id', type: 'uuid' })
  obraId: string;

  @Column({ name: 'pasta_id', type: 'uuid' })
  pastaId: string;

  @Column()
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'nome_original' })
  nomeOriginal: string;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({ name: 'tamanho_bytes', type: 'bigint', nullable: true })
  tamanhoBytes: string | null;

  @Column({ name: 'storage_key' })
  storageKey: string;

  @Column({ name: 'attachment_id', type: 'uuid', nullable: true })
  attachmentId: string | null;

  @Column({ name: 'enviado_por_usuario_id', type: 'uuid' })
  enviadoPorUsuarioId: string;
}

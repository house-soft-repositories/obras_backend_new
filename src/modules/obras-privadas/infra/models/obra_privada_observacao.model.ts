import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';

@Entity({ name: 'obra_privada_observacao' })
export default class ObraPrivadaObservacaoModel {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column({ type: 'text' }) texto: string;
  @Column({ name: 'autor_usuario_id', type: 'uuid' }) autorUsuarioId: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
}

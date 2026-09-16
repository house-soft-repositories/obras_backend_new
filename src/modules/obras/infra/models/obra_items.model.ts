import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import UserModel from '@/modules/users/infra/models/user.model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
@Entity({ name: 'obra_responsaveis' })
export class ObraResponsavelModel {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ name: 'usuario_id', type: 'uuid' }) usuarioId: string;
  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: UserModel;
  @Column() tipo: string;
  @Column({ type: 'timestamptz' }) createdAt: Date;
}
@Entity({ name: 'obra_orcamentos' })
export class ObraOrcamentoModel {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId: string;
  @ManyToOne(() => FonteModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fonte_id' })
  fonte?: FonteModel;
  @Column() valor: string;
}
@Entity({ name: 'obra_seguidores' })
export class ObraSeguidorModel {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ name: 'usuario_id', type: 'uuid' }) usuarioId: string;
  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: UserModel;
  @Column({ type: 'timestamptz' }) seguidoEm: Date;
}

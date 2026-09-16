import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'eixo' })
export class EixoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column() nome!: string;
  @Column({ default: true }) ativo!: boolean;
}

@Entity({ name: 'classificacao' })
export class ClassificacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column() nome!: string;
  @Column({ default: true }) ativo!: boolean;
}

@Entity({ name: 'subclassificacao' })
export class SubclassificacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'classificacao_id', type: 'uuid' }) classificacaoId!: string;
  @ManyToOne(() => ClassificacaoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classificacao_id' })
  classificacao?: ClassificacaoModel;
  @Column() nome!: string;
  @Column({ default: true }) ativo!: boolean;
}

@Entity({ name: 'tipologia' })
export class TipologiaModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column() nome!: string;
  @Column({ default: true }) ativo!: boolean;
}

@Entity({ name: 'subtipologia' })
export class SubtipologiaModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'tipologia_id', type: 'uuid' }) tipologiaId!: string;
  @ManyToOne(() => TipologiaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tipologia_id' })
  tipologia?: TipologiaModel;
  @Column() nome!: string;
  @Column({ default: true }) ativo!: boolean;
}

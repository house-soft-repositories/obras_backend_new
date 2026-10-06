import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'empresa_contratada' })
export class EmpresaContratadaModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'razao_social', type: 'varchar' }) razaoSocial!: string;
  @Column({ name: 'nome_fantasia', type: 'varchar', nullable: true })
  nomeFantasia!: string | null;
  @Column({ type: 'varchar' }) cnpj!: string;
  @Column({ type: 'varchar', nullable: true }) responsavel!: string | null;
  @Column({ name: 'cargo_responsavel', type: 'varchar', nullable: true })
  cargoResponsavel!: string | null;
  @Column({ type: 'varchar', nullable: true }) email!: string | null;
  @Column({ type: 'varchar', nullable: true }) cep!: string | null;
  @Column({ type: 'varchar', nullable: true }) logradouro!: string | null;
  @Column({ type: 'varchar', nullable: true }) numero!: string | null;
  @Column({ type: 'varchar', nullable: true }) complemento!: string | null;
  @Column({ type: 'varchar', nullable: true }) bairro!: string | null;
  @Column({ type: 'varchar', nullable: true }) cidade!: string | null;
  @Column({ type: 'varchar', nullable: true, length: 2 }) uf!: string | null;
  @Column({ type: 'boolean', default: true }) ativo!: boolean;
}

@Entity({ name: 'empresa_contratada_telefone' })
export class EmpresaContratadaTelefoneModel {
  @Column({ primary: true, type: 'uuid' }) id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'empresa_contratada_id', type: 'uuid' })
  empresaContratadaId!: string;
  @ManyToOne(() => EmpresaContratadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_contratada_id' })
  empresaContratada?: EmpresaContratadaModel;
  @Column({ type: 'varchar' }) numero!: string;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

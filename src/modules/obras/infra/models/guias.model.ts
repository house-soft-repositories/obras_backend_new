import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { SituacaoTitularidade } from '@/modules/obras/domain/enums/situacao_titularidade.enum';
import { SituacaoLicenca } from '@/modules/obras/domain/enums/situacao_licenca.enum';
import { TipoRecebimento } from '@/modules/obras/domain/enums/tipo_recebimento.enum';

@Entity({ name: 'obra_localizacao' })
export class ObraLocalizacaoModel {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @Column() localidade!: string;
  @Column({ length: 2 }) uf!: string;
  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;
  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'obra_orcamento_previsto' })
export class ObraOrcamentoPrevistoModel {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId!: string;
  @Column({ type: 'numeric', precision: 18, scale: 2 }) valor!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'titularidade' })
export class TitularidadeModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @Column({ type: 'varchar' }) situacao!: SituacaoTitularidade;
  @Column({ nullable: true, type: 'varchar' }) tipo!: string | null;
  @Column({ nullable: true, type: 'text' }) observacoes!: string | null;
}

@Entity({ name: 'licenca' })
export class LicencaModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @Column({ type: 'varchar' }) situacao!: SituacaoLicenca;
  @Column({ nullable: true, type: 'varchar' }) tipo!: string | null;
  @Column({ nullable: true, type: 'varchar' }) numero!: string | null;
  @Column({ nullable: true, type: 'date' }) validade!: string | null;
  @Column({ nullable: true, type: 'text' }) observacoes!: string | null;
}

@Entity({ name: 'recebimento' })
export class RecebimentoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @Column({ type: 'varchar' }) tipo!: TipoRecebimento;
  @Column({ nullable: true, type: 'date' }) data!: string | null;
  @Column({ name: 'data_prevista', nullable: true, type: 'date' })
  dataPrevista!: string | null;
}

import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import { EmpresaContratadaModel } from '@/modules/contratos/infra/models/empresa_contratada.model';
import { TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
@Entity({ name: 'contrato' })
export class ContratoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ name: 'empresa_contratada_id', type: 'uuid' })
  empresaContratadaId!: string;
  @ManyToOne(() => EmpresaContratadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_contratada_id' })
  empresaContratada?: EmpresaContratadaModel;
  @Column() numero!: string;
  @Column({ nullable: true, type: 'text' }) objeto!: string | null;
  @Column({ name: 'data_assinatura', nullable: true, type: 'date' })
  dataAssinatura!: string | null;
  @Column({ name: 'fim_vigencia', nullable: true, type: 'date' }) fimVigencia!:
    string | null;
  @Column({ name: 'data_os', type: 'date' }) dataOs!: string;
  @Column({ name: 'tipo_prazo_execucao', type: 'varchar' })
  tipoPrazoExecucao!: TipoPrazoExecucao;
  @Column({ name: 'prazo_execucao_dias', nullable: true, type: 'int' })
  prazoExecucaoDias!: number | null;
  @Column({ name: 'prazo_execucao_data', nullable: true, type: 'date' })
  prazoExecucaoData!: string | null;
}
@Entity({ name: 'contrato_fonte' })
export class ContratoFonteModel {
  @Column({ primary: true, type: 'uuid' }) id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'contrato_id', type: 'uuid' }) contratoId!: string;
  @ManyToOne(() => ContratoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: ContratoModel;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId!: string;
  @ManyToOne(() => FonteModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fonte_id' })
  fonte?: FonteModel;
  @Column({ type: 'numeric', precision: 18, scale: 2 }) valor!: string;
}

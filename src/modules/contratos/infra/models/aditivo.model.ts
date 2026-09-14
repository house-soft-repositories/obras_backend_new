import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import {
  TipoAditivo,
  TipoPrazoExecucao,
} from '@/modules/contratos/domain/enums/contratos.enums';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'aditivo' })
export class AditivoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'contrato_id', type: 'uuid' }) contratoId!: string;
  @Column() numero!: string;
  @Column({ type: 'varchar' }) tipo!: TipoAditivo;
  @Column({ name: 'data_assinatura', nullable: true, type: 'date' })
  dataAssinatura!: string | null;
  @Column({ name: 'tipo_prazo_execucao', nullable: true, type: 'varchar' })
  tipoPrazoExecucao!: TipoPrazoExecucao | null;
  @Column({ name: 'prazo_execucao_dias', nullable: true, type: 'int' })
  prazoExecucaoDias!: number | null;
  @Column({ name: 'prazo_execucao_data', nullable: true, type: 'date' })
  prazoExecucaoData!: string | null;
  @Column({ name: 'vigencia_aditivada', nullable: true, type: 'date' })
  vigenciaAditivada!: string | null;
  @Column({ nullable: true, type: 'text' }) observacoes!: string | null;
}
@Entity({ name: 'aditivo_fonte' })
export class AditivoFonteModel {
  @Column({ primary: true, type: 'uuid' }) id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'aditivo_id', type: 'uuid' }) aditivoId!: string;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId!: string;
  @Column({ type: 'numeric', precision: 18, scale: 2 }) valor!: string;
}

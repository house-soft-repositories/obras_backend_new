import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import EmpenhoModel from '@/modules/obras/infra/models/empenho.model';
import LiquidacaoModel from '@/modules/obras/infra/models/liquidacao.model';

@Entity({ name: 'pagamento' })
export default class PagamentoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'empenho_id', type: 'uuid' }) empenhoId!: string;
  @ManyToOne(() => EmpenhoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empenho_id' })
  empenho?: EmpenhoModel;
  @Column({ name: 'liquidacao_id', type: 'uuid' }) liquidacaoId!: string;
  @ManyToOne(() => LiquidacaoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'liquidacao_id' })
  liquidacao?: LiquidacaoModel;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId!: string;
  @ManyToOne(() => FonteModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fonte_id' })
  fonte?: FonteModel;
  @Column({ name: 'numero_ordem_bancaria', type: 'varchar' }) numeroOrdemBancaria!: string;
  @Column({ name: 'data_ordem_bancaria', type: 'date' }) dataOrdemBancaria!: string;
  @Column({ type: 'numeric', precision: 15, scale: 2 }) valor!: string;
  @Column({ type: 'text', nullable: true }) observacoes!: string | null;
}

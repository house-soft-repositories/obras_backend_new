import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import AttachmentModel from '@/modules/attachments/infra/models/attachment.model';
import { ContratoModel } from '@/modules/contratos/infra/models/contrato.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
@Entity({ name: 'paralisacao' })
export class ParalisacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'contrato_id', type: 'uuid' }) contratoId!: string;
  @ManyToOne(() => ContratoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrato_id' })
  contrato?: ContratoModel;
  @Column({ name: 'data_paralisacao', type: 'date' }) dataParalisacao!: string;
  @Column({ type: 'text' }) motivo!: string;
  @Column({ name: 'termo_paralisacao_arquivo_id', type: 'uuid' })
  termoParalisacaoArquivoId!: string;
  @ManyToOne(() => AttachmentModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'termo_paralisacao_arquivo_id' })
  termoParalisacaoArquivo?: AttachmentModel;
  @Column({ name: 'data_reinicio', nullable: true, type: 'date' })
  dataReinicio!: string | null;
  @Column({ name: 'termo_retomada_arquivo_id', nullable: true, type: 'uuid' })
  termoRetomadaArquivoId!: string | null;
  @ManyToOne(() => AttachmentModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'termo_retomada_arquivo_id' })
  termoRetomadaArquivo?: AttachmentModel | null;
  @Column({ name: 'dias_parados', nullable: true, type: 'int' }) diasParados!:
    number | null;
}

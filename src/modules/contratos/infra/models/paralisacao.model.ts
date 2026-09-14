import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'paralisacao' })
export class ParalisacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'contrato_id', type: 'uuid' }) contratoId!: string;
  @Column({ name: 'data_paralisacao', type: 'date' }) dataParalisacao!: string;
  @Column({ type: 'text' }) motivo!: string;
  @Column({ name: 'termo_paralisacao_arquivo_id', type: 'uuid' })
  termoParalisacaoArquivoId!: string;
  @Column({ name: 'data_reinicio', nullable: true, type: 'date' })
  dataReinicio!: string | null;
  @Column({ name: 'termo_retomada_arquivo_id', nullable: true, type: 'uuid' })
  termoRetomadaArquivoId!: string | null;
  @Column({ name: 'dias_parados', nullable: true, type: 'int' }) diasParados!:
    number | null;
}

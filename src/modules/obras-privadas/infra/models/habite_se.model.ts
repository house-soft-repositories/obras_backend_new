import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'habite_se' })
export default class HabiteSeModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column() numero: string;
  @Column({ name: 'data_emissao', nullable: true, type: 'date' }) dataEmissao:
    string | null;
  @Column({ default: false }) parcial: boolean;
  @Column({ name: 'descricao_parcial', nullable: true, type: 'varchar' })
  descricaoParcial: string | null;
  @Column({ name: 'data_vistoria', nullable: true, type: 'date' })
  dataVistoria: string | null;
  @Column({ name: 'vistoriador_usuario_id', nullable: true, type: 'uuid' })
  vistoriadorUsuarioId: string | null;
  @Column({ name: 'fiscalizacao_id', nullable: true, type: 'uuid' })
  fiscalizacaoId: string | null;
  @Column() resultado: string;
  @Column({
    name: 'area_construida_executada_m2',
    nullable: true,
    type: 'numeric',
  })
  areaConstruidaExecutadaM2: string | null;
  @Column({ name: 'divergencia_projeto', default: false })
  divergenciaProjeto: boolean;
  @Column({ name: 'divergencia_descricao', nullable: true, type: 'text' })
  divergenciaDescricao: string | null;
  @Column({ nullable: true, type: 'text' }) parecer: string | null;
  @Column({ name: 'arquivo_id', nullable: true, type: 'uuid' }) arquivoId:
    string | null;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
}

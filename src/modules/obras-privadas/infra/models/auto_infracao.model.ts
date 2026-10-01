import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'auto_infracao' })
export default class AutoInfracaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column({ name: 'fiscalizacao_id', nullable: true, type: 'uuid' })
  fiscalizacaoId: string | null;
  @Column() numero: string;
  @Column() tipo: string;
  @Column({ name: 'data_emissao', type: 'date' }) dataEmissao: string;
  @Column({ name: 'prazo_dias', nullable: true, type: 'int' }) prazoDias:
    number | null;
  @Column({ name: 'data_limite', nullable: true, type: 'date' }) dataLimite:
    string | null;
  @Column({ name: 'base_legal', nullable: true, type: 'text' }) baseLegal:
    string | null;
  @Column({ type: 'text' }) descricao: string;
  @Column({ name: 'valor_multa', nullable: true, type: 'numeric' }) valorMulta:
    string | null;
  @Column({ default: 'ABERTO' }) situacao: string;
  @Column({ name: 'data_encerramento', nullable: true, type: 'date' })
  dataEncerramento: string | null;
  @Column({ nullable: true, type: 'text' }) observacoes: string | null;
  @Column({ name: 'lavrado_por_usuario_id', type: 'uuid' })
  lavradoPorUsuarioId: string;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
}

import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import ProfissionalTecnicoModel from '@/modules/pessoas/infra/models/profissional_tecnico.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
@Entity({ name: 'obra_privada_responsavel' })
export default class ObraPrivadaResponsavelModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column({ name: 'profissional_tecnico_id', type: 'uuid' })
  profissionalTecnicoId: string;
  @Column() papel: string;
  @Column({ name: 'tipo_documento' }) tipoDocumento: string;
  @Column({ name: 'numero_documento' }) numeroDocumento: string;
  @Column({ name: 'data_documento', nullable: true, type: 'date' })
  dataDocumento: string | null;
  @Column({ name: 'arquivo_id', nullable: true, type: 'uuid' }) arquivoId:
    string | null;
  @Column({ name: 'data_inicio', nullable: true, type: 'date' }) dataInicio:
    string | null;
  @Column({ name: 'data_baixa', nullable: true, type: 'date' }) dataBaixa:
    string | null;
  @Column({ name: 'motivo_baixa', nullable: true, type: 'text' }) motivoBaixa:
    string | null;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
  @ManyToOne(() => ProfissionalTecnicoModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profissional_tecnico_id' })
  profissionalTecnico?: ProfissionalTecnicoModel;
}

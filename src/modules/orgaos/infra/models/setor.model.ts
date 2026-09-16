import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'setores' })
export default class SetorModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'orgao_id', type: 'uuid' })
  orgaoId: string;

  @ManyToOne(() => OrgaoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgao_id' })
  orgao?: OrgaoModel;

  @Column()
  nome: string;

  @Column({ default: true })
  ativo: boolean;
}

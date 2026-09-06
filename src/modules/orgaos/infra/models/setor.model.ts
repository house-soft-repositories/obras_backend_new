import { Column, Entity } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';

@Entity({ name: 'setores' })
export default class SetorModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'orgao_id' })
  orgaoId: string;

  @Column()
  nome: string;

  @Column({ default: true })
  ativo: boolean;
}

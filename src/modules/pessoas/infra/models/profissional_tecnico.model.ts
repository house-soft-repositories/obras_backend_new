import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'profissionais_tecnicos' })
export default class ProfissionalTecnicoModel extends BaseModelPrimaryColumnUuid {
  @Column() pessoaId: string;
  @Column() conselho: string;
  @Column() numeroRegistro: string;
  @Column({ nullable: true, type: 'varchar', length: 2 }) ufRegistro: string | null;
  @Column({ nullable: true, type: 'varchar' }) titulo: string | null;
  @Column({ default: true }) ativo: boolean;
}

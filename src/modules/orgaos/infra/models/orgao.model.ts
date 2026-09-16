import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'orgaos' })
export default class OrgaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'localidade_id', type: 'uuid' })
  localidadeId: string;

  @ManyToOne(() => LocalidadeModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'localidade_id' })
  localidade?: LocalidadeModel;

  @Column()
  nome: string;

  @Column({ nullable: true, type: 'varchar' })
  sigla: string | null;

  @Column({ nullable: true, type: 'enum', enum: TipoOrgao })
  tipo: TipoOrgao | null;

  @Column({ nullable: true, type: 'varchar' })
  responsavel: string | null;

  @Column({ nullable: true, type: 'varchar' })
  email: string | null;

  @Column({ nullable: true, type: 'varchar' })
  telefone: string | null;

  @Column({ default: true })
  ativo: boolean;
}

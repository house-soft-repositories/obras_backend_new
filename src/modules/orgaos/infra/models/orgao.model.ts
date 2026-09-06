import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'orgaos' })
export default class OrgaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'localidade_id' })
  localidadeId: string;

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

import { Column, Entity } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';

@Entity({ name: 'orgaos' })
export default class OrgaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'localidade_id' })
  localidadeId: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  sigla: string | null;

  @Column({ nullable: true })
  tipo: TipoOrgao | null;

  @Column({ nullable: true })
  responsavel: string | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ nullable: true })
  telefone: string | null;

  @Column({ default: true })
  ativo: boolean;
}

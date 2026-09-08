import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'fontes' })
export default class FonteModel extends BaseModelPrimaryColumnUuid {
  @Column() nome: string;
  @Column({ nullable: true, type: 'varchar' }) descricao: string | null;
  @Column({ nullable: true, type: 'varchar' }) codigo: string | null;
  @Column({ nullable: true, type: 'varchar' }) tipo: string | null;
  @Column({ nullable: true, type: 'varchar' }) valorPrevisto: string | null;
  @Column({ nullable: true, type: 'varchar' }) vigencia: string | null;
  @Column({ default: true }) ativo: boolean;
}

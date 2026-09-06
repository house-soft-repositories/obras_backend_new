import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'localidades' })
export default class LocalidadeModel extends BaseModelPrimaryColumnUuid {
  @Column()
  nome: string;

  @Column({ length: 2 })
  uf: string;

  @Column({ name: 'codigo_ibge', nullable: true, type: 'varchar' })
  codigoIbge: string | null;

  @Column({ nullable: true, type: 'enum', enum: TipoLocalidade })
  tipo: TipoLocalidade | null;

  @Column({ nullable: true, type: 'varchar' })
  municipio: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;
}

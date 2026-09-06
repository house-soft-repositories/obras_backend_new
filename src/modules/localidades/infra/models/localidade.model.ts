import { Column, Entity } from 'typeorm';
import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';

@Entity({ name: 'localidades' })
export default class LocalidadeModel extends BaseModelPrimaryColumnUuid {
  @Column()
  nome: string;

  @Column({ length: 2 })
  uf: string;

  @Column({ name: 'codigo_ibge', nullable: true })
  codigoIbge: string | null;

  @Column({ nullable: true })
  tipo: TipoLocalidade | null;

  @Column({ nullable: true })
  municipio: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;
}

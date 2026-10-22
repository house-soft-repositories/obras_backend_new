import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity, OneToMany } from 'typeorm';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import MedicaoFonteModel from '@/modules/cronograma/infra/models/medicao_fonte.model';

@Entity({ name: 'medicao' })
export default class MedicaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'obra_id' })
  obraId!: string;

  @Column({ name: 'orgao_id', type: 'uuid', nullable: true })
  orgaoId!: string | null;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ type: 'varchar' })
  tipo!: TipoMedicao;

  @Column({ name: 'data', type: 'date' })
  data!: string;

  @Column({ type: 'text', nullable: true })
  observacao!: string | null;

  @OneToMany(
    () => MedicaoFonteModel,
    (fonte) => fonte.medicao,
    {
      cascade: true,
    },
  )
  fontes!: MedicaoFonteModel[];
}

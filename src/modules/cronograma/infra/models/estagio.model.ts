import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';
import { EstagioStatus } from '@/modules/cronograma/domain/enums/cronograma.enums';
import { ModoDuracao } from '@/modules/cronograma/domain/enums/cronograma.enums';

@Entity({ name: 'estagio' })
export default class EstagioModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'obra_id' })
  obraId!: string;

  @Column()
  nome!: string;

  @Column({ type: 'int', default: 0 })
  posicao!: number;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ type: 'varchar', default: EstagioStatus.PENDENTE })
  status!: EstagioStatus;

  @Column({
    name: 'modo_duracao',
    type: 'varchar',
    default: ModoDuracao.NAO_INFORMADO,
  })
  modoDuracao!: ModoDuracao;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio!: string | null;

  @Column({ name: 'data_fim', type: 'date', nullable: true })
  dataFim!: string | null;

  @Column({
    name: 'percentual_direto',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  percentualDireto!: number | null;

  @Column({ name: 'responsavel_usuario_id', type: 'uuid', nullable: true })
  responsavelUsuarioId!: string | null;

  @Column({ name: 'estagio_pai_id', type: 'uuid', nullable: true })
  estagioPaiId!: string | null;
}

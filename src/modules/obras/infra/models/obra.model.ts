import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';
import SetorModel from '@/modules/orgaos/infra/models/setor.model';
import UserModel from '@/modules/users/infra/models/user.model';
import {
  ClassificacaoModel,
  EixoModel,
  SubclassificacaoModel,
  SubtipologiaModel,
  TipologiaModel,
} from '@/modules/obras/infra/models/cadastro.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';
import { ModoDuracao } from '@/modules/obras/domain/enums/modo_duracao.enum';
import { AcaoConveniada } from '@/modules/obras/domain/enums/acao_conveniada.enum';

@Entity({ name: 'obras' })
export default class ObraModel extends BaseModelPrimaryColumnUuid {
  @Column() codigo!: string;
  @Column() nome!: string;
  @Column({ nullable: true, type: 'varchar' }) descricao!: string | null;
  @Column({ type: 'varchar' }) tipo!: TipoObra;
  @Column({ type: 'varchar', default: StatusObra.EM_ABERTO })
  status!: StatusObra;
  @Column({ type: 'varchar', default: TipoFinanciamento.SEM_OGU })
  tipoFinanciamento!: TipoFinanciamento;
  @Column({ type: 'varchar', default: ModoDuracao.DEFINIDO_PELO_USUARIO })
  modoDuracao!: ModoDuracao;
  @Column({ nullable: true, type: 'date' }) dataInicio!: string | null;
  @Column({ nullable: true, type: 'date' }) dataPrazo!: string | null;
  @Column({ type: 'varchar', default: AcaoConveniada.NAO })
  acaoConveniada!: AcaoConveniada;
  @Column({ default: false }) prioritaria!: boolean;
  @Column({ default: false }) exibirCameraAoVivo!: boolean;
  @Column({ nullable: true, type: 'varchar' }) cameraUrl!: string | null;
  @Column({ default: false }) privado!: boolean;
  @Column({ default: false }) invisivel!: boolean;
  @Column({ default: false }) considerarSabado!: boolean;
  @Column({ default: false }) considerarDomingo!: boolean;
  @Column({ default: false }) seguirAutomatico!: boolean;
  @Column({ default: false }) vincularPagamentoPercentual!: boolean;
  @Column({ default: false }) corresponsaveisPodemEditar!: boolean;
  @Column({ name: 'orgao_id', type: 'uuid' }) orgaoId!: string;
  @ManyToOne(() => OrgaoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgao_id' })
  orgao?: OrgaoModel;
  @Column({ name: 'setor_id', nullable: true, type: 'uuid' }) setorId!: string | null;
  @ManyToOne(() => SetorModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'setor_id' })
  setor?: SetorModel | null;
  @Column({ name: 'localidade_id', nullable: true, type: 'uuid' }) localidadeId!: string | null;
  @ManyToOne(() => LocalidadeModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'localidade_id' })
  localidade?: LocalidadeModel | null;
  @Column({ name: 'subclassificacao_id', nullable: true, type: 'uuid' }) subclassificacaoId!: string | null;
  @ManyToOne(() => SubclassificacaoModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subclassificacao_id' })
  subclassificacao?: SubclassificacaoModel | null;
  @Column({ name: 'eixo_id', nullable: true, type: 'uuid' }) eixoId!: string | null;
  @ManyToOne(() => EixoModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eixo_id' })
  eixo?: EixoModel | null;
  @Column({ name: 'classificacao_id', nullable: true, type: 'uuid' }) classificacaoId!: string | null;
  @ManyToOne(() => ClassificacaoModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classificacao_id' })
  classificacao?: ClassificacaoModel | null;
  @Column({ name: 'tipologia_id', nullable: true, type: 'uuid' }) tipologiaId!: string | null;
  @ManyToOne(() => TipologiaModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tipologia_id' })
  tipologia?: TipologiaModel | null;
  @Column({ name: 'subtipologia_id', nullable: true, type: 'uuid' }) subtipologiaId!: string | null;
  @ManyToOne(() => SubtipologiaModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subtipologia_id' })
  subtipologia?: SubtipologiaModel | null;
  @Column({ nullable: true, type: 'varchar' }) programaPpa!: string | null;
  @Column({ nullable: true, type: 'varchar' }) acaoEstrategica!: string | null;
  @Column({ nullable: true, type: 'varchar' }) acaoOrcamentaria!: string | null;
  @Column({ nullable: true, type: 'varchar' }) unidadeMedida!: string | null;
  @Column({ nullable: true, type: 'numeric', precision: 18, scale: 4 })
  quantidade!: string | null;
  @Column({ nullable: true, type: 'varchar' }) secretario!: string | null;
  @Column({ nullable: true, type: 'date' }) dataPactuada!: string | null;
  @Column({ name: 'criado_por_usuario_id', type: 'uuid' }) criadoPorUsuarioId!: string;
  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'criado_por_usuario_id' })
  criadoPorUsuario?: UserModel;
  @Column({ nullable: true, type: 'timestamptz' }) deletedAt!: Date | null;
}

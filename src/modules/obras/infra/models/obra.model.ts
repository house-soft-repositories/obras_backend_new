import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'obras' })
export default class ObraModel extends BaseModelPrimaryColumnUuid {
  @Column() codigo!: string;
  @Column() nome!: string;
  @Column({ nullable: true, type: 'varchar' }) descricao!: string | null;
  @Column() tipo!: string;
  @Column({ default: 'EM_ABERTO' }) status!: string;
  @Column({ default: 'SEM_OGU' }) tipoFinanciamento!: string;
  @Column({ default: 'DEFINIDO_PELO_USUARIO' }) modoDuracao!: string;
  @Column({ nullable: true, type: 'date' }) dataInicio!: string | null;
  @Column({ nullable: true, type: 'date' }) dataPrazo!: string | null;
  @Column({ default: 'NAO' }) acaoConveniada!: string;
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
  @Column() orgaoId!: string;
  @Column({ nullable: true, type: 'uuid' }) setorId!: string | null;
  @Column({ nullable: true, type: 'uuid' }) localidadeId!: string | null;
  @Column({ nullable: true, type: 'uuid' }) subclassificacaoId!: string | null;
  @Column({ nullable: true, type: 'uuid' }) eixoId!: string | null;
  @Column({ nullable: true, type: 'uuid' }) classificacaoId!: string | null;
  @Column({ nullable: true, type: 'uuid' }) tipologiaId!: string | null;
  @Column({ nullable: true, type: 'uuid' }) subtipologiaId!: string | null;
  @Column({ nullable: true, type: 'varchar' }) programaPpa!: string | null;
  @Column({ nullable: true, type: 'varchar' }) acaoEstrategica!: string | null;
  @Column({ nullable: true, type: 'varchar' }) acaoOrcamentaria!: string | null;
  @Column({ nullable: true, type: 'varchar' }) unidadeMedida!: string | null;
  @Column({ nullable: true, type: 'numeric', precision: 18, scale: 4 }) quantidade!: string | null;
  @Column({ nullable: true, type: 'varchar' }) secretario!: string | null;
  @Column({ nullable: true, type: 'date' }) dataPactuada!: string | null;
  @Column({ type: 'uuid' }) criadoPorUsuarioId!: string;
  @Column({ nullable: true, type: 'timestamptz' }) deletedAt!: Date | null;
}

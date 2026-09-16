import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import {
  ObraOrcamentoPrevistoEntity,
  ObraResponsavelEntity,
  ObraSeguidorEntity,
} from '@/modules/obras/domain/entities/obra_items.entity';
import ICreateObraUseCase, {
  CreateObraParam,
} from '@/modules/obras/domain/usecase/create_obra.usecase';
import ObraDomainException from '@/modules/obras/exceptions/obra_domain.exception';
import ObraServiceException from '@/modules/obras/exceptions/obra_service.exception';
import { proximoCodigo } from '@/modules/obras/services/codigo_obra.service';
import { DataSource } from 'typeorm';

export default class CreateObraService implements ICreateObraUseCase {
  constructor(
    private readonly obraRepo: IObraRepository,
    private readonly fonteRepo: IFonteRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async execute(p: CreateObraParam): AsyncResult<AppException, ObraEntity> {
    try {
      if (!p.orcamentos || p.orcamentos.length < 1) {
        return left(
          new ObraDomainException({
            code: ErrorCodeConstants.OBRA_INVALID_ORCAMENTO,
          }),
        );
      }
      if (p.subclassificacaoId && p.tipo !== 'OBRA') {
        return left(
          new ObraDomainException({
            code: ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO,
          }),
        );
      }
      for (const orcamento of p.orcamentos) {
        const fonte = await this.fonteRepo.findById(orcamento.fonteId);
        if (fonte.isLeft()) return left(fonte.value);
        if (!fonte.value) {
          return left(
            new ObraServiceException({
              code: ErrorCodeConstants.OBRA_FONTE_INATIVA,
              statusCode: 422,
            }),
          );
        }
        if (!fonte.value.ativo) {
          return left(
            new ObraServiceException({
              code: ErrorCodeConstants.OBRA_FONTE_INATIVA,
              statusCode: 422,
            }),
          );
        }
      }

      const year = new Date().getFullYear();
      let codigo: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const last = await this.obraRepo.findLastCodigo(year);
        if (last.isLeft()) return left(last.value);
        codigo = proximoCodigo('OBR', last.value, year);
        const entity = ObraEntity.create({
          tenantId: p.tenantId,
          codigo,
          nome: p.nome,
          descricao: p.descricao,
          tipo: p.tipo,
          tipoFinanciamento: p.tipoFinanciamento,
          modoDuracao: p.modoDuracao,
          dataInicio: p.dataInicio,
          dataPrazo: p.dataPrazo,
          acaoConveniada: p.acaoConveniada,
          prioritaria: p.prioritaria,
          exibirCameraAoVivo: p.exibirCameraAoVivo,
          cameraUrl: p.cameraUrl,
          privado: p.privado,
          invisivel: p.invisivel,
          considerarSabado: p.considerarSabado,
          considerarDomingo: p.considerarDomingo,
          seguirAutomatico: p.seguirAutomatico,
          vincularPagamentoPercentual: p.vincularPagamentoPercentual,
          corresponsaveisPodemEditar: p.corresponsaveisPodemEditar,
          orgaoId: p.orgaoId,
          setorId: p.setorId,
          localidadeId: p.localidadeId,
          subclassificacaoId: p.subclassificacaoId,
          eixoId: p.eixoId,
          classificacaoId: p.classificacaoId,
          tipologiaId: p.tipologiaId,
          subtipologiaId: p.subtipologiaId,
          programaPpa: p.programaPpa,
          acaoEstrategica: p.acaoEstrategica,
          acaoOrcamentaria: p.acaoOrcamentaria,
          unidadeMedida: p.unidadeMedida,
          quantidade: p.quantidade,
          secretario: p.secretario,
          dataPactuada: p.dataPactuada,
          criadoPorUsuarioId: p.criadoPorUsuarioId,
        });
        const schema = this.tc.require().schemaName;
        try {
          const saved = await this.ds.transaction(async (manager) => {
            const obra = await manager.query(
              `INSERT INTO "${schema}"."obras" (id,codigo,nome,descricao,tipo,status,tipo_financiamento,modo_duracao,data_inicio,data_prazo,acao_conveniada,prioritaria,exibir_camera_ao_vivo,camera_url,privado,invisivel,considerar_sabado,considerar_domingo,seguir_automatico,vincular_pagamento_percentual,corresponsaveis_podem_editar,orgao_id,setor_id,localidade_id,subclassificacao_id,eixo_id,classificacao_id,tipologia_id,subtipologia_id,programa_ppa,acao_estrategica,acao_orcamentaria,unidade_medida,quantidade,secretario,data_pactuada,criado_por_usuario_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39) RETURNING id`,
              [
                entity.toObject().id,
                codigo,
                entity.toObject().nome,
                entity.toObject().descricao,
                entity.toObject().tipo,
                entity.toObject().status,
                entity.toObject().tipoFinanciamento,
                entity.toObject().modoDuracao,
                entity.toObject().dataInicio,
                entity.toObject().dataPrazo,
                entity.toObject().acaoConveniada,
                entity.toObject().prioritaria,
                entity.toObject().exibirCameraAoVivo,
                entity.toObject().cameraUrl,
                entity.toObject().privado,
                entity.toObject().invisivel,
                entity.toObject().considerarSabado,
                entity.toObject().considerarDomingo,
                entity.toObject().seguirAutomatico,
                entity.toObject().vincularPagamentoPercentual,
                entity.toObject().corresponsaveisPodemEditar,
                entity.toObject().orgaoId,
                entity.toObject().setorId,
                entity.toObject().localidadeId,
                entity.toObject().subclassificacaoId,
                entity.toObject().eixoId,
                entity.toObject().classificacaoId,
                entity.toObject().tipologiaId,
                entity.toObject().subtipologiaId,
                entity.toObject().programaPpa,
                entity.toObject().acaoEstrategica,
                entity.toObject().acaoOrcamentaria,
                entity.toObject().unidadeMedida,
                entity.toObject().quantidade,
                entity.toObject().secretario,
                entity.toObject().dataPactuada,
                entity.toObject().criadoPorUsuarioId,
                entity.toObject().createdAt,
                entity.toObject().updatedAt,
              ],
            );
            const obraId = obra[0].id;
            const responsavel = ObraResponsavelEntity.createResponsible({
              tenantId: p.tenantId,
              obraId,
              usuarioId: p.responsavelUsuarioId,
            });
            await manager.query(
              `INSERT INTO "${schema}"."obra_responsaveis" (id,tenant_id,obra_id,usuario_id,tipo,created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
              [
                responsavel.toObject().id,
                p.tenantId,
                obraId,
                p.responsavelUsuarioId,
                'RESPONSAVEL',
                responsavel.toObject().createdAt,
              ],
            );
            for (const orcamento of p.orcamentos) {
              const orcamentoEntity = ObraOrcamentoPrevistoEntity.create({
                tenantId: p.tenantId,
                obraId,
                fonteId: orcamento.fonteId,
                valor: orcamento.valor,
              });
              await manager.query(
                `INSERT INTO "${schema}"."obra_orcamentos" (id,tenant_id,obra_id,fonte_id,valor) VALUES ($1,$2,$3,$4,$5)`,
                [
                  orcamentoEntity.toObject().id,
                  p.tenantId,
                  obraId,
                  orcamento.fonteId,
                  orcamento.valor,
                ],
              );
            }
            if (entity.toObject().seguirAutomatico) {
              const seguidor = ObraSeguidorEntity.create({
                tenantId: p.tenantId,
                obraId,
                usuarioId: p.criadoPorUsuarioId,
              });
              await manager.query(
                `INSERT INTO "${schema}"."obra_seguidores" (id,tenant_id,obra_id,usuario_id,seguido_em) VALUES ($1,$2,$3,$4,$5)`,
                [
                  seguidor.toObject().id,
                  p.tenantId,
                  obraId,
                  p.criadoPorUsuarioId,
                  seguidor.toObject().seguidoEm,
                ],
              );
            }
            return entity;
          });
          return right(saved);
        } catch (error: unknown) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            'constraint' in error &&
            error.code === '23505' &&
            String(error.constraint).includes('codigo')
          ) {
            continue;
          }
          throw error;
        }
      }
      return left(
        new ObraServiceException({
          code: ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,
          statusCode: 409,
        }),
      );
    } catch (error) {
      if (error instanceof ObraDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ObraServiceException({
          code: ErrorCodeConstants.OBRA_CREATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

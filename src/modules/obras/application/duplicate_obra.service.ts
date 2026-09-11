import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IDuplicateObraUseCase, { DuplicateObraParam } from '@/modules/obras/domain/usecase/duplicate_obra.usecase';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import ObraServiceException from '@/modules/obras/exceptions/obra_service.exception';
import { randomUUID } from 'node:crypto';
import { proximoCodigo } from '@/modules/obras/services/codigo_obra.service';

export default class DuplicateObraService implements IDuplicateObraUseCase {
  constructor(
    private readonly repo: IObraRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}

  async execute(param: DuplicateObraParam): AsyncResult<AppException, ObraEntity> {
    try {
      const ctx = this.tc.require();
      const schema = ctx.schemaName;
      const found = await this.repo.findById(param.id);
      if (found.isLeft()) return left(found.value);
      const origin = found.value;
      if (!origin)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const year = new Date().getFullYear();
      for (let attempt = 0; attempt < 3; attempt++) {
        const last = await this.repo.findLastCodigo(year);
        if (last.isLeft()) return left(last.value);
        const codigo = proximoCodigo('OBR', last.value, year);
        const o = origin.toObject();
        const dupEntity = ObraEntity.create({
          tenantId: o.tenantId,
          codigo,
          nome: o.nome,
          descricao: o.descricao,
          tipo: o.tipo,
          status: 'EM_ABERTO',
          tipoFinanciamento: o.tipoFinanciamento,
          modoDuracao: o.modoDuracao,
          dataInicio: o.dataInicio,
          dataPrazo: o.dataPrazo,
          acaoConveniada: o.acaoConveniada,
          prioritaria: o.prioritaria,
          exibirCameraAoVivo: o.exibirCameraAoVivo,
          cameraUrl: o.cameraUrl,
          privado: o.privado,
          invisivel: o.invisivel,
          considerarSabado: o.considerarSabado,
          considerarDomingo: o.considerarDomingo,
          seguirAutomatico: o.seguirAutomatico,
          vincularPagamentoPercentual: o.vincularPagamentoPercentual,
          corresponsaveisPodemEditar: o.corresponsaveisPodemEditar,
          orgaoId: o.orgaoId,
          setorId: o.setorId,
          localidadeId: o.localidadeId,
          subclassificacaoId: o.subclassificacaoId,
          eixoId: o.eixoId,
          classificacaoId: o.classificacaoId,
          tipologiaId: o.tipologiaId,
          subtipologiaId: o.subtipologiaId,
          programaPpa: o.programaPpa,
          acaoEstrategica: o.acaoEstrategica,
          acaoOrcamentaria: o.acaoOrcamentaria,
          unidadeMedida: o.unidadeMedida,
          quantidade: o.quantidade,
          secretario: o.secretario,
          dataPactuada: o.dataPactuada,
          criadoPorUsuarioId: o.criadoPorUsuarioId,
        });
        try {
          const saved = await this.ds.transaction(async (m) => {
            const v = dupEntity.toObject();
            await m.query(
              `INSERT INTO "${schema}"."obras" (id,codigo,nome,descricao,tipo,status,tipo_financiamento,modo_duracao,data_inicio,data_prazo,acao_conveniada,prioritaria,exibir_camera_ao_vivo,camera_url,privado,invisivel,considerar_sabado,considerar_domingo,seguir_automatico,vincular_pagamento_percentual,corresponsaveis_podem_editar,orgao_id,setor_id,localidade_id,subclassificacao_id,eixo_id,classificacao_id,tipologia_id,subtipologia_id,programa_ppa,acao_estrategica,acao_orcamentaria,unidade_medida,quantidade,secretario,data_pactuada,criado_por_usuario_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38)`,
              [
                v.id,
                v.codigo,
                v.nome,
                v.descricao,
                v.tipo,
                v.status,
                v.tipoFinanciamento,
                v.modoDuracao,
                v.dataInicio,
                v.dataPrazo,
                v.acaoConveniada,
                v.prioritaria,
                v.exibirCameraAoVivo,
                v.cameraUrl,
                v.privado,
                v.invisivel,
                v.considerarSabado,
                v.considerarDomingo,
                v.seguirAutomatico,
                v.vincularPagamentoPercentual,
                v.corresponsaveisPodemEditar,
                v.orgaoId,
                v.setorId,
                v.localidadeId,
                v.subclassificacaoId,
                v.eixoId,
                v.classificacaoId,
                v.tipologiaId,
                v.subtipologiaId,
                v.programaPpa,
                v.acaoEstrategica,
                v.acaoOrcamentaria,
                v.unidadeMedida,
                v.quantidade,
                v.secretario,
                v.dataPactuada,
                v.criadoPorUsuarioId,
                v.createdAt,
                v.updatedAt,
              ],
            );
            const orcamentos = await m.query(`SELECT id, fonte_id, valor FROM "${schema}"."obra_orcamentos" WHERE obra_id=$1`, [origin.id]);
            for (const oRow of orcamentos as Array<{ id: string; fonte_id: string; valor: string }>) {
              await m.query(
                `INSERT INTO "${schema}"."obra_orcamentos" (id, tenant_id, obra_id, fonte_id, valor) VALUES ($1,$2,$3,$4,$5)`,
                [randomUUID(), o.tenantId, v.id, oRow.fonte_id, oRow.valor],
              );
            }
            const responsaveis = await m.query(`SELECT usuario_id, tipo FROM "${schema}"."obra_responsaveis" WHERE obra_id=$1`, [origin.id]);
            for (const rRow of responsaveis as Array<{ usuario_id: string; tipo: string }>) {
              await m.query(
                `INSERT INTO "${schema}"."obra_responsaveis" (id, tenant_id, obra_id, usuario_id, tipo, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
                [randomUUID(), o.tenantId, v.id, rRow.usuario_id, rRow.tipo, new Date()],
              );
            }
            return dupEntity;
          });
          return right(saved);
        } catch (e: unknown) {
          const err = e as { code?: string; constraint?: string };
          if (err?.code === '23505' && String(err?.constraint || '').includes('codigo')) continue;
          throw e;
        }
      }
      return left(
        new ObraServiceException({
          code: ErrorCodeConstants.OBRA_DUPLICATE_CODIGO,
          statusCode: 409,
        }),
      );
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ObraServiceException({
          code: ErrorCodeConstants.OBRA_DUPLICATE_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

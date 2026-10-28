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
import ObraEventsService from '@/modules/obras/events/obra_events.service';
import { proximoCodigo } from '@/modules/obras/services/codigo_obra.service';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import { DataSource } from 'typeorm';
import { withManager } from '@/core/multitenancy/tenant_manager';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import {
  ObraResponsavelModel,
  ObraSeguidorModel,
} from '@/modules/obras/infra/models/obra_items.model';
import { ObraOrcamentoPrevistoModel } from '@/modules/obras/infra/models/guias.model';
import ObraMapper from '@/modules/obras/infra/mapper/obra.mapper';
import ObraItemsMapper from '@/modules/obras/infra/mapper/obra_items.mapper';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

export default class CreateObraService implements ICreateObraUseCase {
  constructor(
    private readonly obraRepo: IObraRepository,
    private readonly fonteRepo: IFonteRepository,
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
    private readonly events: ObraEventsService,
    private readonly users: IUserRepository,
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
      if (p.subclassificacaoId && p.tipo !== TipoObra.OBRA) {
        return left(
          new ObraDomainException({
            code: ErrorCodeConstants.OBRA_INVALID_SUBCLASSIFICACAO,
          }),
        );
      }
      const context = this.tc.require();
      if (context.tenantId !== p.tenantId)
        return left(
          new ObraServiceException({
            code: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL,
            statusCode: 422,
          }),
        );
      const userResult = await this.users.findById(p.responsavelUsuarioId);
      if (userResult.isLeft()) return left(userResult.value);
      if (
        userResult.value.tenantId !== p.tenantId ||
        userResult.value.role !== UserRole.STAFF
      )
        return left(
          new ObraServiceException({
            code: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL,
            statusCode: 422,
          }),
        );
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
        try {
          const saved = await withManager(this.ds, this.tc, async (manager) => {
            const obraModel = await manager
              .getRepository(ObraModel)
              .save(
                manager
                  .getRepository(ObraModel)
                  .create(ObraMapper.toModel(entity)),
              );
            const obraId = obraModel.id;
            const responsavel = ObraResponsavelEntity.createResponsible({
              tenantId: p.tenantId,
              obraId,
              usuarioId: p.responsavelUsuarioId,
              role: userResult.value.role,
            });
            await manager
              .getRepository(ObraResponsavelModel)
              .save(
                manager
                  .getRepository(ObraResponsavelModel)
                  .create(ObraItemsMapper.responsavelToModel(responsavel)),
              );
            await manager.getRepository(ObraOrcamentoPrevistoModel).save(
              p.orcamentos.map((orcamento) => {
                const budget = ObraOrcamentoPrevistoEntity.create({
                  tenantId: p.tenantId,
                  obraId,
                  fonteId: orcamento.fonteId,
                  valor: orcamento.valor,
                });
                return manager
                  .getRepository(ObraOrcamentoPrevistoModel)
                  .create(ObraItemsMapper.orcamentoToModel(budget));
              }),
            );
            if (entity.seguirAutomatico) {
              const seguidor = ObraSeguidorEntity.create({
                tenantId: p.tenantId,
                obraId,
                usuarioId: p.criadoPorUsuarioId,
              });
              await manager
                .getRepository(ObraSeguidorModel)
                .save(ObraItemsMapper.seguidorToModel(seguidor));
            }
            return ObraMapper.toEntity(obraModel);
          });
          this.events.emitirObraCriada({
            tenantId: p.tenantId,
            obraId: saved.toObject().id,
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

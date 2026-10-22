import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IDuplicateObraUseCase, {
  DuplicateObraParam,
} from '@/modules/obras/domain/usecase/duplicate_obra.usecase';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import ObraServiceException from '@/modules/obras/exceptions/obra_service.exception';
import ObraEventsService from '@/modules/obras/events/obra_events.service';
import { proximoCodigo } from '@/modules/obras/services/codigo_obra.service';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';

export default class DuplicateObraService implements IDuplicateObraUseCase {
  constructor(
    private readonly repo: IObraRepository,
    private readonly tc: TenantContext,
    private readonly events: ObraEventsService,
  ) {}

  async execute(
    param: DuplicateObraParam,
  ): AsyncResult<AppException, ObraEntity> {
    try {
      const ctx = this.tc.require();
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
        const source = origin.toObject();
        const duplicate = ObraEntity.create({
          codigo,
          nome: source.nome,
          descricao: source.descricao,
          tipo: source.tipo,
          status: StatusObra.EM_ABERTO,
          tipoFinanciamento: source.tipoFinanciamento,
          modoDuracao: source.modoDuracao,
          dataInicio: source.dataInicio,
          dataPrazo: source.dataPrazo,
          acaoConveniada: source.acaoConveniada,
          prioritaria: source.prioritaria,
          exibirCameraAoVivo: source.exibirCameraAoVivo,
          cameraUrl: source.cameraUrl,
          privado: source.privado,
          invisivel: source.invisivel,
          considerarSabado: source.considerarSabado,
          considerarDomingo: source.considerarDomingo,
          seguirAutomatico: source.seguirAutomatico,
          vincularPagamentoPercentual: source.vincularPagamentoPercentual,
          corresponsaveisPodemEditar: source.corresponsaveisPodemEditar,
          orgaoId: source.orgaoId,
          setorId: source.setorId,
          localidadeId: source.localidadeId,
          subclassificacaoId: source.subclassificacaoId,
          eixoId: source.eixoId,
          classificacaoId: source.classificacaoId,
          tipologiaId: source.tipologiaId,
          subtipologiaId: source.subtipologiaId,
          programaPpa: source.programaPpa,
          acaoEstrategica: source.acaoEstrategica,
          acaoOrcamentaria: source.acaoOrcamentaria,
          unidadeMedida: source.unidadeMedida,
          quantidade: source.quantidade,
          secretario: source.secretario,
          dataPactuada: source.dataPactuada,
          criadoPorUsuarioId: source.criadoPorUsuarioId,
        });

        const saved = await this.repo.duplicate(duplicate, origin.id);
        if (saved.isRight()) {
          this.events.emitirObraDuplicada({
            tenantId: ctx.tenantId,
            origemObraId: origin.id,
            novaObraId: saved.value.id,
            copiarArquivos: param.copiarArquivos ?? false,
          });
          return right(saved.value);
        }
        if (
          saved.value.code === ErrorCodeConstants.OBRA_DUPLICATE_CODIGO &&
          saved.value.statusCode === 409
        )
          continue;
        return left(saved.value);
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

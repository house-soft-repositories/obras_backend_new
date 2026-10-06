import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import { withTenantManager } from '@/core/multitenancy/tenant_manager';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import prepareArquivoPrivadoUpload from '@/modules/obras-privadas/application/prepare_arquivo_privado_upload';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import { VinculoArquivoPrivado } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ICreateHabiteSeUseCase, {
  CreateHabiteSeParam,
  CreateHabiteSeResult,
} from '@/modules/obras-privadas/domain/usecase/create_habite_se.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import HabiteSeMapper from '@/modules/obras-privadas/infra/mapper/habite_se.mapper';
import HabiteSeModel from '@/modules/obras-privadas/infra/models/habite_se.model';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import { DataSource, EntityManager } from 'typeorm';
export default class CreateHabiteSeService implements ICreateHabiteSeUseCase {
  constructor(
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
    private readonly dataSource: DataSource,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}
  async execute(
    param: CreateHabiteSeParam,
  ): AsyncResult<AppException, CreateHabiteSeResult> {
    try {
      const obra = await this.obraPrivadaRepository.findById(
        param.obraPrivadaId,
      );
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value || obra.value.toObject().deletedAt)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (param.arquivo && !param.usuarioId) {
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
            statusCode: 400,
          }),
        );
      }
      const result = await withTenantManager(
        this.dataSource,
        this.tenantContext,
        async (manager: EntityManager) => {
          const entity = HabiteSeEntity.create({
            tenantId: param.tenantId,
            obraPrivadaId: param.obraPrivadaId,
            numero: param.numero,
            dataEmissao: param.dataEmissao ?? null,
            parcial: param.parcial ?? false,
            descricaoParcial: param.descricaoParcial ?? null,
            dataVistoria: param.dataVistoria ?? null,
            vistoriadorUsuarioId: param.vistoriadorUsuarioId ?? null,
            fiscalizacaoId: param.fiscalizacaoId ?? null,
            resultado: param.resultado,
            areaConstruidaExecutadaM2: param.areaConstruidaExecutadaM2 ?? null,
            divergenciaProjeto: param.divergenciaProjeto ?? false,
            divergenciaDescricao: param.divergenciaDescricao ?? null,
            parecer: param.parecer ?? null,
            arquivoId: null,
          });
          const props = entity.toObject();
          await manager
            .getRepository(HabiteSeModel)
            .save(HabiteSeMapper.toModel(entity));
          const arquivo = param.arquivo
            ? await prepareArquivoPrivadoUpload({
                manager,
                schema: this.tenantContext.require().schemaName,
                storage: this.storage,
                tenantId: props.tenantId,
                obraPrivadaId: props.obraPrivadaId,
                vinculo: VinculoArquivoPrivado.HABITE_SE,
                vinculoId: props.id,
                arquivo: param.arquivo,
                usuarioId: param.usuarioId as string,
              })
            : undefined;
          return { habiteSe: entity, arquivo };
        },
      );
      return right(result);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.HABITE_SE_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

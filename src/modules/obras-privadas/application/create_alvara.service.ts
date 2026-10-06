import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import { withTenantManager } from '@/core/multitenancy/tenant_manager';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import prepareArquivoPrivadoUpload from '@/modules/obras-privadas/application/prepare_arquivo_privado_upload';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import { VinculoArquivoPrivado } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ICreateAlvaraUseCase, {
  CreateAlvaraParam,
  CreateAlvaraResult,
} from '@/modules/obras-privadas/domain/usecase/create_alvara.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import AlvaraMapper from '@/modules/obras-privadas/infra/mapper/alvara.mapper';
import AlvaraModel from '@/modules/obras-privadas/infra/models/alvara.model';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import { DataSource, EntityManager } from 'typeorm';

export default class CreateAlvaraService implements ICreateAlvaraUseCase {
  constructor(
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
    private readonly dataSource: DataSource,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: CreateAlvaraParam,
  ): AsyncResult<AppException, CreateAlvaraResult> {
    try {
      const obra = await this.obraPrivadaRepository.findById(
        param.obraPrivadaId,
      );
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value || obra.value.toObject().deletedAt) {
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
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
          const entity = AlvaraEntity.create({
            tenantId: param.tenantId,
            obraPrivadaId: param.obraPrivadaId,
            numero: param.numero ?? null,
            ano: param.ano,
            tipo: param.tipo,
            motivo: param.motivo,
            situacao: param.situacao,
            dataEmissao: param.dataEmissao ?? null,
            dataValidade: param.dataValidade ?? null,
            alvaraAnteriorId: param.alvaraAnteriorId ?? null,
            areaTerrenoM2: param.areaTerrenoM2 ?? null,
            areaConstruidaAprovadaM2: param.areaConstruidaAprovadaM2 ?? null,
            uso: param.uso ?? null,
            pavimentos: param.pavimentos ?? null,
            unidades: param.unidades ?? null,
            processoAdministrativo: param.processoAdministrativo ?? null,
            arquivoId: null,
            observacoes: param.observacoes ?? null,
          });
          const props = entity.toObject();
          await manager
            .getRepository(AlvaraModel)
            .save(AlvaraMapper.toModel(entity));
          const arquivo = param.arquivo
            ? await prepareArquivoPrivadoUpload({
                manager,
                schema: this.tenantContext.require().schemaName,
                storage: this.storage,
                tenantId: props.tenantId,
                obraPrivadaId: props.obraPrivadaId,
                vinculo: VinculoArquivoPrivado.ALVARA,
                vinculoId: props.id,
                arquivo: param.arquivo,
                usuarioId: param.usuarioId as string,
              })
            : undefined;
          return { alvara: entity, arquivo };
        },
      );
      return right(result);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.ALVARA_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

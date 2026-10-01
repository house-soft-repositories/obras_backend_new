import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IObraPrivadaArquivoRepository from '@/modules/obras-privadas/adapters/obra_privada_arquivo_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import { CategoriaArquivoPrivado } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import IIniciarUploadArquivoUseCase, {
  IniciarUploadArquivoParam,
  UploadArquivoPreparado,
} from '@/modules/obras-privadas/domain/usecase/iniciar_upload_arquivo.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';
import { buildObraPrivadaArquivoStorageKey } from '@/modules/obras-privadas/infra/storage/obra_privada_arquivo_storage_key';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class IniciarUploadArquivoService implements IIniciarUploadArquivoUseCase {
  constructor(
    private readonly arquivos: IObraPrivadaArquivoRepository,
    private readonly obras: IObraPrivadaRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(
    param: IniciarUploadArquivoParam,
  ): AsyncResult<AppException, UploadArquivoPreparado[]> {
    try {
      if (!param.arquivos || param.arquivos.length < 1)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
            statusCode: 400,
          }),
        );
      const found = await this.obras.findById(param.obraPrivadaId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const prefix = this.tenantContext.require().schemaName;
      const preparados: UploadArquivoPreparado[] = [];
      const criados: ObraPrivadaArquivoEntity[] = [];
      for (const item of param.arquivos) {
        const key = buildObraPrivadaArquivoStorageKey(
          prefix,
          param.obraPrivadaId,
          item.nomeOriginal,
        );
        const entity = ObraPrivadaArquivoEntity.create({
          tenantId: found.value.toObject().tenantId,
          obraPrivadaId: param.obraPrivadaId,
          vinculo: param.vinculo,
          vinculoId: param.vinculoId,
          categoria: item.categoria ?? CategoriaArquivoPrivado.DOCUMENTO,
          nome: item.nome,
          descricao: item.descricao,
          nomeOriginal: item.nomeOriginal,
          mimeType: item.mimeType,
          ordem: item.ordem,
          latitude: item.latitude,
          longitude: item.longitude,
          capturadoEm: item.capturadoEm ? new Date(item.capturadoEm) : undefined,
          storageKey: key,
          enviadoPorUsuarioId: param.usuarioId,
        });
        const saved = await this.arquivos.save(entity);
        if (saved.isLeft()) {
          for (const criado of criados) await this.arquivos.delete(criado.id);
          return left(saved.value);
        }
        const url = await this.storage.getUploadUrl(
          key,
          item.mimeType ?? 'application/octet-stream',
        );
        if (url.isLeft()) {
          await this.arquivos.delete(saved.value.id);
          for (const criado of criados) await this.arquivos.delete(criado.id);
          return left(url.value);
        }
        criados.push(saved.value);
        preparados.push({
          arquivoId: saved.value.id,
          nome: saved.value.toObject().nome,
          urlUpload: url.value,
        });
      }
      return right(preparados);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.OBRA_PRIVADA_ARQUIVO_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import IPastaRepository from '@/modules/documentos/adapters/pasta_repository.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import IDuplicarArvoreUseCase, {
  DuplicarArvoreParam,
} from '@/modules/documentos/domain/usecase/duplicar_arvore.usecase';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';
import { buildDocumentStorageKey } from '@/modules/documentos/infra/storage/document_storage_key';
import IStorageService from '@/modules/storage/adapters/storage_service.interface';

export default class DuplicarArvoreService implements IDuplicarArvoreUseCase {
  constructor(
    private readonly pastas: IPastaRepository,
    private readonly arquivos: IArquivoRepository,
    private readonly attachments: IAttachmentRepository,
    private readonly storage: IStorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  async execute(param: DuplicarArvoreParam): AsyncResult<AppException, Unit> {
    try {
      const prefix = this.tenantContext.require().schemaName;
      const pastasOrigem = await this.pastas.findByObraId(param.obraOrigemId);
      if (pastasOrigem.isLeft()) return left(pastasOrigem.value);
      const mapa = new Map<string, string>();
      for (const origem of pastasOrigem.value) {
        const nova = PastaEntity.create({
          obraId: param.obraDestinoId,
          pastaPaiId: null,
          nome: origem.nome,
          criadoPorUsuarioId: origem.criadoPorUsuarioId,
        });
        const saved = await this.pastas.save(nova);
        if (saved.isLeft()) return left(saved.value);
        mapa.set(origem.id, saved.value.id);
      }
      for (const origem of pastasOrigem.value) {
        if (!origem.pastaPaiId) continue;
        const novaId = mapa.get(origem.id);
        const novaPastaPaiId = mapa.get(origem.pastaPaiId);
        if (!novaId || !novaPastaPaiId) continue;
        const found = await this.pastas.findById(novaId);
        if (found.isLeft()) return left(found.value);
        if (!found.value) continue;
        const religada = PastaEntity.fromData({
          ...found.value.toObject(),
          pastaPaiId: novaPastaPaiId,
          updatedAt: new Date(),
        });
        const saved = await this.pastas.save(religada);
        if (saved.isLeft()) return left(saved.value);
      }
      const arquivosOrigem = await this.arquivos.findByObraId(
        param.obraOrigemId,
      );
      if (arquivosOrigem.isLeft()) return left(arquivosOrigem.value);
      for (const origem of arquivosOrigem.value) {
        const novaPastaId = mapa.get(origem.pastaId);
        if (!novaPastaId)
          return left(
            new ArquivoServiceException({
              code: ErrorCodeConstants.DOCUMENTO_DUPLICATE_FAILED,
              statusCode: 500,
            }),
          );
        const novaKey = buildDocumentStorageKey(
          prefix,
          param.obraDestinoId,
          novaPastaId,
          origem.nomeOriginal,
        );
        const copied = await this.storage.copyObject(
          origem.storageKey,
          novaKey,
        );
        if (copied.isLeft())
          return left(
            new ArquivoServiceException({
              code: ErrorCodeConstants.DOCUMENTO_DUPLICATE_FAILED,
              statusCode: 500,
              cause: copied.value,
            }),
          );
        const copia = ArquivoEntity.create({
          obraId: param.obraDestinoId,
          pastaId: novaPastaId,
          nome: origem.nome,
          descricao: origem.descricao,
          nomeOriginal: origem.nomeOriginal,
          mimeType: origem.mimeType,
          tamanhoBytes: origem.tamanhoBytes,
          storageKey: novaKey,
          attachmentId: null,
          enviadoPorUsuarioId: origem.enviadoPorUsuarioId,
        });
        const espelho = AttachmentEntity.create({
          fileUrl: novaKey,
          originalName: origem.nomeOriginal,
          entityType: ATTACHMENT_ENTITY_TYPE.DOCUMENTO,
          entityId: copia.id,
          createdBy: origem.enviadoPorUsuarioId,
        });
        const mirrorSaved = await this.attachments.save(espelho);
        if (mirrorSaved.isLeft()) return left(mirrorSaved.value);
        const saved = await this.arquivos.save(
          copia.vincularAttachment(mirrorSaved.value.id),
        );
        if (saved.isLeft()) return left(saved.value);
      }
      return right(unit);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ArquivoServiceException({
          code: ErrorCodeConstants.DOCUMENTO_DUPLICATE_FAILED,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

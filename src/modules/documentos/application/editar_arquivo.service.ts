import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import type IAttachmentRepository from '@/modules/attachments/adapters/attachment_repository.interface';
import AttachmentEntity from '@/modules/attachments/domain/entities/attachment.entity';
import IArquivoRepository from '@/modules/documentos/adapters/arquivo_repository.interface';
import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import IEditarArquivoUseCase, {
  EditarArquivoParam,
} from '@/modules/documentos/domain/usecase/editar_arquivo.usecase';
import ArquivoDomainException from '@/modules/documentos/exceptions/arquivo_domain.exception';
import ArquivoRepositoryException from '@/modules/documentos/exceptions/arquivo_repository.exception';
import ArquivoServiceException from '@/modules/documentos/exceptions/arquivo_service.exception';

export default class EditarArquivoService implements IEditarArquivoUseCase {
  constructor(
    private readonly arquivos: IArquivoRepository,
    private readonly attachments: IAttachmentRepository,
  ) {}

  async execute(
    param: EditarArquivoParam,
  ): AsyncResult<AppException, ArquivoEntity> {
    try {
      const found = await this.arquivos.findById(param.arquivoId);
      if (found.isLeft()) return left(found.value);
      if (!found.value)
        return left(
          new ArquivoRepositoryException({
            code: ErrorCodeConstants.ARQUIVO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const editado = found.value.editar({
        nome: param.nome,
        descricao: param.descricao,
      });
      const saved = await this.arquivos.save(editado);
      if (saved.isLeft()) return left(saved.value);
      if (saved.value.attachmentId && param.nome !== undefined) {
        const mirror = await this.attachments.findById(saved.value.attachmentId);
        if (mirror.isRight()) {
          const atualizado = AttachmentEntity.fromData({
            ...mirror.value.toObject(),
            originalName: saved.value.nome,
            updatedBy: param.usuarioId,
            updatedAt: new Date(),
          });
          const mirrorSaved = await this.attachments.save(atualizado);
          if (mirrorSaved.isLeft()) return left(mirrorSaved.value);
        }
      }
      return saved;
    } catch (error) {
      if (error instanceof ArquivoDomainException) return left(error);
      if (error instanceof AppException) return left(error);
      return left(
        new ArquivoServiceException({
          code: ErrorCodeConstants.ARQUIVO_INVALID_INPUT,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}

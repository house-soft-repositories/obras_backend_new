import type UseCase from '@/core/types/use_case';

export type GetAttachmentDownloadUrlParam = {
  id: string;
};

export type AttachmentDownloadUrl = {
  attachmentId: string;
  fileUrl: string;
  downloadUrl: string;
};

type IGetAttachmentDownloadUrlUseCase = UseCase<
  GetAttachmentDownloadUrlParam,
  AttachmentDownloadUrl
>;

export default IGetAttachmentDownloadUrlUseCase;

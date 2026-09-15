import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AttachmentDomainException from '@/modules/attachments/exceptions/attachment_domain.exception';
import { ATTACHMENT_ENTITY_TYPE } from '@/modules/attachments/domain/enums/attachment_entity_type.enum';

export interface AttachmentProps {
  id: string;
  fileUrl: string;
  originalName: string;
  entityType: ATTACHMENT_ENTITY_TYPE;
  entityId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAttachmentProps = Pick<
  AttachmentProps,
  'fileUrl' | 'originalName' | 'entityType' | 'entityId' | 'createdBy'
> & { updatedBy?: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default class AttachmentEntity {
  private constructor(private readonly props: AttachmentProps) {}

  static create(props: CreateAttachmentProps): AttachmentEntity {
    this.validateFileUrl(props.fileUrl);
    this.validateOriginalName(props.originalName);
    this.validateEntityType(props.entityType);
    this.validateEntityId(props.entityId);
    this.validateActor(props.createdBy);
    if (props.updatedBy !== undefined) this.validateActor(props.updatedBy);
    const now = new Date();
    return new AttachmentEntity({
      id: randomUUID(),
      fileUrl: props.fileUrl,
      originalName: props.originalName.trim(),
      entityType: props.entityType,
      entityId: props.entityId,
      createdBy: props.createdBy,
      updatedBy: props.updatedBy ?? props.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: AttachmentProps): AttachmentEntity {
    return new AttachmentEntity(props);
  }

  replaceFile(
    fileUrl: string,
    originalName: string,
    updatedBy: string,
  ): AttachmentEntity {
    AttachmentEntity.validateFileUrl(fileUrl);
    AttachmentEntity.validateOriginalName(originalName);
    AttachmentEntity.validateActor(updatedBy);
    return new AttachmentEntity({
      ...this.props,
      fileUrl,
      originalName: originalName.trim(),
      updatedBy,
      updatedAt: new Date(),
    });
  }

  toObject(): AttachmentProps {
    return { ...this.props };
  }

  private static validateOriginalName(originalName: string): void {
    if (!originalName?.trim())
      throw new AttachmentDomainException({
        code: ErrorCodeConstants.ATTACHMENT_INVALID_FILE,
      });
  }

  private static validateFileUrl(fileUrl: string): void {
    if (!fileUrl?.trim())
      throw new AttachmentDomainException({
        code: ErrorCodeConstants.ATTACHMENT_INVALID_FILE,
      });
  }

  private static validateEntityType(entityType: ATTACHMENT_ENTITY_TYPE): void {
    if (!Object.values(ATTACHMENT_ENTITY_TYPE).includes(entityType))
      throw new AttachmentDomainException({
        code: ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY_TYPE,
      });
  }

  private static validateEntityId(entityId: string): void {
    if (!entityId || !UUID_PATTERN.test(entityId))
      throw new AttachmentDomainException({
        code: ErrorCodeConstants.ATTACHMENT_INVALID_ENTITY,
      });
  }

  private static validateActor(actor: string): void {
    if (!actor?.trim())
      throw new AttachmentDomainException({
        code: ErrorCodeConstants.ATTACHMENT_INVALID_ACTOR,
      });
  }

  get id() {
    return this.props.id;
  }
  get fileUrl() {
    return this.props.fileUrl;
  }
  get originalName() {
    return this.props.originalName;
  }
  get entityType() {
    return this.props.entityType;
  }
  get entityId() {
    return this.props.entityId;
  }
  get createdBy() {
    return this.props.createdBy;
  }
  get updatedBy() {
    return this.props.updatedBy;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserDomainException from '@/modules/users/exceptions/user_domain.exception';
import { randomUUID } from 'node:crypto';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId: string | null;
  localidadeId: string | null;
  orgaoId: string | null;
  setorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CreateUserProps = Pick<
  UserProps,
  'name' | 'email' | 'password'
> &
  Partial<Pick<UserProps, 'localidadeId' | 'orgaoId' | 'setorId'>>;

export type UpdateUserProps = Partial<
  Pick<
    UserProps,
    'name' | 'email' | 'password' | 'localidadeId' | 'orgaoId' | 'setorId'
  >
>;

export default class UserEntity {
  private constructor(private readonly props: UserProps) {}

  static createSuperAdmin(props: CreateUserProps): UserEntity {
    return this.create(props, UserRole.SUPERADMIN, null);
  }

  static createAdmin(props: CreateUserProps, tenantId: string): UserEntity {
    return this.create(props, UserRole.ADMIN, tenantId);
  }

  static createStaff(props: CreateUserProps, tenantId: string): UserEntity {
    return this.create(props, UserRole.STAFF, tenantId);
  }

  static createUser(props: CreateUserProps, tenantId: string): UserEntity {
    return this.create(props, UserRole.USER, tenantId);
  }

  private static create(
    props: CreateUserProps,
    role: UserRole,
    tenantId: string | null,
  ): UserEntity {
  if (props.name.trim().length < 2) {
      throw new UserDomainException({
        code: ErrorCodeConstants.USER_INVALID_NAME,
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)) {
      throw new UserDomainException({
        code: ErrorCodeConstants.USER_INVALID_EMAIL,
      });
    }
    if (!props.password) {
      throw new UserDomainException({
        code: ErrorCodeConstants.USER_INVALID_PASSWORD,
      });
    }
    if (role !== UserRole.SUPERADMIN && !this.isUuid(tenantId)) {
      throw new UserDomainException({
        code: ErrorCodeConstants.USER_INVALID_TENANT,
      });
    }
    for (const value of [props.localidadeId, props.orgaoId, props.setorId]) {
      if (value !== undefined && value !== null && !this.isUuid(value)) {
        throw new UserDomainException({
          code: ErrorCodeConstants.USER_INVALID_TENANT,
        });
      }
    }

    const now = new Date();
    return new UserEntity({
      id: randomUUID(),
      name: props.name.trim(),
      email: props.email.toLowerCase(),
      password: props.password,
      role,
      tenantId,
      localidadeId: props.localidadeId ?? null,
      orgaoId: props.orgaoId ?? null,
      setorId: props.setorId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  private static isUuid(value: string | null): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
    );
  }

  static fromData(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  update(props: UpdateUserProps): UserEntity {
    const updated = UserEntity.create(
      {
        name: props.name ?? this.name,
        email: props.email ?? this.email,
        password: props.password ?? this.password,
        localidadeId:
          props.localidadeId === undefined ? this.localidadeId : props.localidadeId,
        orgaoId: props.orgaoId === undefined ? this.orgaoId : props.orgaoId,
        setorId: props.setorId === undefined ? this.setorId : props.setorId,
      },
      this.role,
      this.tenantId,
    );
    return UserEntity.fromData({
      ...updated.toObject(),
      id: this.id,
      createdAt: this.createdAt,
    });
  }

  toObject(): UserProps {
    return { ...this.props };
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }
  get password() {
    return this.props.password;
  }
  get role() {
    return this.props.role;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get localidadeId() {
    return this.props.localidadeId;
  }
  get orgaoId() {
    return this.props.orgaoId;
  }
  get setorId() {
    return this.props.setorId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

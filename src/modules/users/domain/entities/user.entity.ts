import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserDomainException from '@/modules/users/exceptions/user_domain.exception';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CreateUserProps = Pick<UserProps, 'name' | 'email' | 'password'>;

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

  private static create(props: CreateUserProps, role: UserRole, tenantId: string | null): UserEntity {
    if (props.name.trim().length < 2) {
      throw new UserDomainException({ code: ErrorCodeConstants.USER_INVALID_NAME });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)) {
      throw new UserDomainException({ code: ErrorCodeConstants.USER_INVALID_EMAIL });
    }
    if (!props.password) {
      throw new UserDomainException({ code: ErrorCodeConstants.USER_INVALID_PASSWORD });
    }
    if (role !== UserRole.SUPERADMIN && !this.isUuid(tenantId)) {
      throw new UserDomainException({ code: ErrorCodeConstants.USER_INVALID_TENANT });
    }

    const now = new Date();
    return new UserEntity({
      id: randomUUID(),
      name: props.name.trim(),
      email: props.email.toLowerCase(),
      password: props.password,
      role,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });
  }

  private static isUuid(value: string | null): value is string {
    return typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  }

  static fromData(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get password() { return this.props.password; }
  get role() { return this.props.role; }
  get tenantId() { return this.props.tenantId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}

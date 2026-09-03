import ErrorCodeConstants from '@/core/constants/error_code.constants';
import UserEntity from '@/modules/users/domain/entities/user.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import UserDomainException from '@/modules/users/exceptions/user_domain.exception';
import { validUser } from '@test/constants/users/domain/entities/user.constants';

describe('UserEntity', () => {
  it('creates a superadmin without tenant context', () => {
    const user = UserEntity.createSuperAdmin(validUser);

    expect(user.role).toBe(UserRole.SUPERADMIN);
    expect(user.tenantId).toBeNull();
  });

  it('creates an admin with a tenant', () => {
    const user = UserEntity.createAdmin(validUser, validUser.tenantId);

    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.tenantId).toBe(validUser.tenantId);
  });

  it('creates a staff member with a tenant', () => {
    const user = UserEntity.createStaff(validUser, validUser.tenantId);

    expect(user.role).toBe(UserRole.STAFF);
    expect(user.tenantId).toBe(validUser.tenantId);
  });

  it('creates a standard user with a tenant', () => {
    const user = UserEntity.createUser(validUser, validUser.tenantId);

    expect(user.role).toBe(UserRole.USER);
    expect(user.tenantId).toBe(validUser.tenantId);
  });

  it('rejects a tenant-bound user without a valid tenant id', () => {
    expect.assertions(2);
    try {
      UserEntity.createUser(validUser, 'invalid');
    } catch (error) {
      if (!(error instanceof UserDomainException)) {
        throw error;
      }

      expect(error).toBeInstanceOf(UserDomainException);
      expect(error.code).toBe(ErrorCodeConstants.USER_INVALID_TENANT);
    }
  });
});

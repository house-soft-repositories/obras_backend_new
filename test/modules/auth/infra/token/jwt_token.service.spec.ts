import JwtTokenService from '@/modules/auth/infra/token/jwt_token.service';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import AuthTokenException from '@/modules/auth/exceptions/auth_token.exception';
import mockConfigurationService from '@test/mocks/core/services/configuration_service.mock';
import { JwtService } from '@nestjs/jwt';

describe('JwtTokenService', () => {
  const service = new JwtTokenService(mockConfigurationService());

  it('issues and verifies access tokens with only access claims', async () => {
    const token = await service.signAccess({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      role: UserRole.ADMIN,
      tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    });

    await expect(service.verifyAccess(token)).resolves.toMatchObject({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.ADMIN,
      tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    });
  });

  it('rejects a refresh token at the access boundary', async () => {
    const token = await service.signRefresh({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      sid: '0c4d7c37-2455-4634-9ce4-37ce30bd8f78',
    });

    await expect(service.verifyAccess(token)).rejects.toBeInstanceOf(AuthTokenException);
  });

  it('rejects a refresh-typed token even when it has access-shaped claims', async () => {
    const token = await new JwtService({ secret: 'test-jwt-secret' }).signAsync({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'refresh',
      role: UserRole.ADMIN,
      tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
    });

    await expect(service.verifyAccess(token)).rejects.toBeInstanceOf(AuthTokenException);
  });
});

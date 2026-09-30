import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import GetOrgaoService from '@/modules/orgaos/application/get_orgao.service';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { orgaoIds, validOrgao } from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockOrgaoRepository from '@test/mocks/orgaos/adapters/orgao_repository.mock';

describe('GetOrgaoService', () => {
  it('returns the orgao', async () => {
    const repository = mockOrgaoRepository();
    const entity = OrgaoEntity.create({ ...validOrgao });
    repository.findById.mockResolvedValue(right(entity));

    const result = await new GetOrgaoService(repository).execute({
      id: entity.id,
      role: UserRole.USER,
    });

    expect(result.getOrThrow()).toMatchObject({ id: entity.id });
    expect(repository.findById).toHaveBeenCalledWith(entity.id);
  });

  it('propagates not-found from the repository', async () => {
    const repository = mockOrgaoRepository();
    repository.findById.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new GetOrgaoService(repository).execute({
      id: orgaoIds.orgaoId,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('denies read with 403 when role is not orgao reader', async () => {
    const repository = mockOrgaoRepository();

    const result = await new GetOrgaoService(repository).execute({
      id: orgaoIds.orgaoId,
      role: UserRole.SUPERADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
    expect(repository.findById.mock.calls).toHaveLength(0);
  });
});

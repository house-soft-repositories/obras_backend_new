import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import DeleteOrgaoService from '@/modules/orgaos/application/delete_orgao.service';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { orgaoIds, validOrgao } from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockOrgaoRepository from '@test/mocks/orgaos/adapters/orgao_repository.mock';

describe('DeleteOrgaoService', () => {
  const entity = OrgaoEntity.create({ ...validOrgao });

  function emptyRepository() {
    const repository = mockOrgaoRepository();
    repository.findById.mockResolvedValue(right(entity));
    repository.countSetores.mockResolvedValue(right(0));
    repository.countLinkedUsers.mockResolvedValue(right(0));
    repository.countLinkedObras.mockResolvedValue(right(0));
    repository.delete.mockResolvedValue(right(undefined));
    return repository;
  }

  it('deletes an orgao without links', async () => {
    const repository = emptyRepository();

    const result = await new DeleteOrgaoService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isRight()).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith(entity.id);
  });

  it('blocks deletion with 409 when the orgao still has setores', async () => {
    const repository = emptyRepository();
    repository.countSetores.mockResolvedValue(right(2));

    const result = await new DeleteOrgaoService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_HAS_LINKED_SETORES,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('blocks deletion with 409 when the orgao still has linked users', async () => {
    const repository = emptyRepository();
    repository.countLinkedUsers.mockResolvedValue(right(1));

    const result = await new DeleteOrgaoService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_HAS_LINKED_USERS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('blocks deletion with 409 when the orgao still has obras', async () => {
    const repository = emptyRepository();
    repository.countLinkedObras.mockResolvedValue(right(3));

    const result = await new DeleteOrgaoService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_HAS_LINKED_OBRAS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('returns not-found without deleting when the orgao does not exist', async () => {
    const repository = emptyRepository();
    repository.findById.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new DeleteOrgaoService(repository).execute({
      id: orgaoIds.orgaoId,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_NOT_FOUND,
      statusCode: 404,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('denies deletion with 403 when role is not orgao writer', async () => {
    const repository = emptyRepository();

    const result = await new DeleteOrgaoService(repository).execute({
      id: orgaoIds.orgaoId,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
    expect(repository.findById.mock.calls).toHaveLength(0);
    expect(repository.delete.mock.calls).toHaveLength(0);
  });
});

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import DeleteSetorService from '@/modules/orgaos/application/delete_setor.service';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { orgaoIds, validSetor } from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockSetorRepository from '@test/mocks/orgaos/adapters/setor_repository.mock';

describe('DeleteSetorService', () => {
  const entity = SetorEntity.create({ ...validSetor });

  function emptyRepository() {
    const repository = mockSetorRepository();
    repository.findById.mockResolvedValue(right(entity));
    repository.countLinkedUsers.mockResolvedValue(right(0));
    repository.countLinkedObras.mockResolvedValue(right(0));
    repository.delete.mockResolvedValue(right(undefined));
    return repository;
  }

  it('deletes a setor without links', async () => {
    const repository = emptyRepository();

    const result = await new DeleteSetorService(repository).execute({
      id: entity.id,
      role: UserRole.STAFF,
    });

    expect(result.isRight()).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith(entity.id);
  });

  it('blocks deletion with 409 when the setor still has linked users', async () => {
    const repository = emptyRepository();
    repository.countLinkedUsers.mockResolvedValue(right(1));

    const result = await new DeleteSetorService(repository).execute({
      id: entity.id,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_HAS_LINKED_USERS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('blocks deletion with 409 when the setor still has obras', async () => {
    const repository = emptyRepository();
    repository.countLinkedObras.mockResolvedValue(right(2));

    const result = await new DeleteSetorService(repository).execute({
      id: entity.id,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_HAS_LINKED_OBRAS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('returns not-found without deleting when the setor does not exist', async () => {
    const repository = emptyRepository();
    repository.findById.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new DeleteSetorService(repository).execute({
      id: orgaoIds.setorId,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_NOT_FOUND,
      statusCode: 404,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('denies deletion with 403 when role is not setor writer', async () => {
    const repository = emptyRepository();

    const result = await new DeleteSetorService(repository).execute({
      id: orgaoIds.setorId,
      role: UserRole.USER,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
    expect(repository.findById.mock.calls).toHaveLength(0);
    expect(repository.delete.mock.calls).toHaveLength(0);
  });
});

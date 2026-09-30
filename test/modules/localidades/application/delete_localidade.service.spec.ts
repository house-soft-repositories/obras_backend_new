import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import DeleteLocalidadeService from '@/modules/localidades/application/delete_localidade.service';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeRepositoryException from '@/modules/localidades/exceptions/localidade_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  localidadeIds,
  validLocalidade,
} from '@test/constants/localidades/domain/entities/localidade.constants';
import mockLocalidadeRepository from '@test/mocks/localidades/adapters/localidade_repository.mock';

describe('DeleteLocalidadeService', () => {
  const entity = LocalidadeEntity.create({
    nome: validLocalidade.nome,
    uf: validLocalidade.uf,
    codigoIbge: validLocalidade.codigoIbge,
    tipo: validLocalidade.tipo,
    municipio: validLocalidade.municipio,
    observacoes: validLocalidade.observacoes,
  });

  function emptyRepository() {
    const repository = mockLocalidadeRepository();
    repository.findById.mockResolvedValue(right(entity));
    repository.countOrgaos.mockResolvedValue(right(0));
    repository.countLinkedUsers.mockResolvedValue(right(0));
    repository.countLinkedObras.mockResolvedValue(right(0));
    repository.delete.mockResolvedValue(right(undefined));
    return repository;
  }

  it('deletes a localidade without links', async () => {
    const repository = emptyRepository();

    const result = await new DeleteLocalidadeService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isRight()).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith(entity.id);
  });

  it('blocks deletion with 409 when the localidade still has orgaos', async () => {
    const repository = emptyRepository();
    repository.countOrgaos.mockResolvedValue(right(1));

    const result = await new DeleteLocalidadeService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_HAS_LINKED_ORGAOS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('blocks deletion with 409 when the localidade still has linked users', async () => {
    const repository = emptyRepository();
    repository.countLinkedUsers.mockResolvedValue(right(1));

    const result = await new DeleteLocalidadeService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_HAS_LINKED_USERS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('blocks deletion with 409 when the localidade still has obras', async () => {
    const repository = emptyRepository();
    repository.countLinkedObras.mockResolvedValue(right(4));

    const result = await new DeleteLocalidadeService(repository).execute({
      id: entity.id,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected blocked failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_HAS_LINKED_OBRAS,
      statusCode: 409,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('returns not-found without deleting when the localidade does not exist', async () => {
    const repository = emptyRepository();
    repository.findById.mockResolvedValue(
      left(
        new LocalidadeRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new DeleteLocalidadeService(repository).execute({
      id: localidadeIds.foreignLocalidadeId,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
      statusCode: 404,
    });
    expect(repository.delete.mock.calls).toHaveLength(0);
  });

  it('denies deletion with 403 when role is not writer', async () => {
    const repository = emptyRepository();

    const result = await new DeleteLocalidadeService(repository).execute({
      id: localidadeIds.foreignLocalidadeId,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
    expect(repository.findById.mock.calls).toHaveLength(0);
    expect(repository.delete.mock.calls).toHaveLength(0);
  });
});

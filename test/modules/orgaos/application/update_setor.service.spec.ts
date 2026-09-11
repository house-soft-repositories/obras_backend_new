import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockSetorRepository from '@test/mocks/orgaos/adapters/setor_repository.mock';
import UpdateSetorService from '@/modules/orgaos/application/update_setor.service';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';

describe('UpdateSetorService', () => {
  const destinationOrgaoId = 'c10c8252-92cf-4d4b-9f20-26e9f451d23a';
  const props = {
    orgaoId: orgaoIds.orgaoId,
    nome: validSetor.nome,
    ativo: validSetor.ativo,
  };

  it('updates only supplied sector fields including active state', async () => {
    const repository = mockSetorRepository();
    const current = SetorEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

    const result = await new UpdateSetorService(repository).execute({
      id: current.id,
      nome: 'Projetos',
      ativo: false,
      role: UserRole.STAFF,
    });

    expect(result.getOrThrow()).toMatchObject({
      id: current.id,
      orgaoId: orgaoIds.orgaoId,
      nome: 'Projetos',
      ativo: false,
    });
    expect(repository.existsOrgao.mock.calls).toHaveLength(0);
  });

  it('moves a sector to a verified destination organization', async () => {
    const repository = mockSetorRepository();
    const current = SetorEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.existsOrgao.mockResolvedValue(right(true));
    repository.countLinkedUsers.mockResolvedValue(right(0));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

    const result = await new UpdateSetorService(repository).execute({
      id: current.id,
      orgaoId: destinationOrgaoId,
      role: UserRole.STAFF,
    });

    expect(result.getOrThrow()).toMatchObject({
      id: current.id,
      orgaoId: destinationOrgaoId,
      nome: validSetor.nome,
      ativo: validSetor.ativo,
    });
    expect(repository.existsOrgao.mock.calls).toContainEqual([
      destinationOrgaoId,
    ]);
  });

  it('rejects moving a sector with linked users', async () => {
    const repository = mockSetorRepository();
    const current = SetorEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.existsOrgao.mockResolvedValue(right(true));
    repository.countLinkedUsers.mockResolvedValue(right(1));

    const result = await new UpdateSetorService(repository).execute({
      id: current.id,
      orgaoId: destinationOrgaoId,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected linked-user failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_HAS_LINKED_USERS,
      statusCode: 422,
    });
  });

  it('returns missing destination organization before moving a sector', async () => {
    const repository = mockSetorRepository();
    const current = SetorEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.existsOrgao.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new UpdateSetorService(repository).execute({
      id: current.id,
      orgaoId: destinationOrgaoId,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('returns missing sector as not found before update persistence', async () => {
    const repository = mockSetorRepository();
    repository.findById.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new UpdateSetorService(repository).execute({
      id: orgaoIds.setorId,
      ativo: false,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.existsOrgao.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_NOT_FOUND,
      statusCode: 404,
    });
  });
});

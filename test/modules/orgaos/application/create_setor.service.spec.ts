import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockSetorRepository from '@test/mocks/orgaos/adapters/setor_repository.mock';
import CreateSetorService from '@/modules/orgaos/application/create_setor.service';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';

describe('CreateSetorService', () => {
  const destinationOrgaoId = 'c10c8252-92cf-4d4b-9f20-26e9f451d23a';
  const props = {
    orgaoId: orgaoIds.orgaoId,
    nome: validSetor.nome,
    ativo: validSetor.ativo,
  };

  it.each([UserRole.ADMIN, UserRole.STAFF])(
    'allows %s to create a sector after parent organization validation',
    async (role) => {
      const repository = mockSetorRepository();
      repository.existsOrgao.mockResolvedValue(right(true));
      repository.save.mockImplementation((entity) =>
        Promise.resolve(right(entity)),
      );

      const result = await new CreateSetorService(repository).execute({
        ...props,
        role,
      });

      expect(result.getOrThrow()).toMatchObject({
        nome: validSetor.nome,
        orgaoId: orgaoIds.orgaoId,
      });
      expect(repository.existsOrgao.mock.calls).toContainEqual([
        orgaoIds.orgaoId,
      ]);
    },
  );

  it('validates parent organization before attempting a user sector write', async () => {
    const repository = mockSetorRepository();
    repository.existsOrgao.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new CreateSetorService(repository).execute({
      ...props,
      role: UserRole.USER,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.existsOrgao.mock.calls).toContainEqual([
      orgaoIds.orgaoId,
    ]);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('returns missing organization as not found before sector persistence', async () => {
    const repository = mockSetorRepository();
    repository.existsOrgao.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new CreateSetorService(repository).execute({
      ...props,
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
});

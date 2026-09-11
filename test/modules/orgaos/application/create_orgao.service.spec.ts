import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validOrgao,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockOrgaoRepository from '@test/mocks/orgaos/adapters/orgao_repository.mock';
import CreateOrgaoService from '@/modules/orgaos/application/create_orgao.service';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';

describe('CreateOrgaoService', () => {
  const destinationLocalidadeId = '1b1bce89-53b4-4f23-80a7-7c32c1e6d0d1';
  const props = {
    localidadeId: orgaoIds.localidadeId,
    nome: validOrgao.nome,
    sigla: null,
    tipo: validOrgao.tipo,
    responsavel: null,
    email: null,
    telefone: null,
    ativo: validOrgao.ativo,
  };

  it('allows an admin to create an organization after parent locality validation', async () => {
    const repository = mockOrgaoRepository();
    repository.existsLocalidade.mockResolvedValue(right(true));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

    const result = await new CreateOrgaoService(repository).execute({
      ...props,
      role: UserRole.ADMIN,
    });

    expect(result.getOrThrow()).toMatchObject({
      nome: validOrgao.nome,
      localidadeId: orgaoIds.localidadeId,
    });
    expect(repository.existsLocalidade.mock.calls).toContainEqual([
      orgaoIds.localidadeId,
    ]);
    expect(repository.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({ localidadeId: orgaoIds.localidadeId }),
    );
  });

  it('validates parent locality before attempting a non-admin organization write', async () => {
    const repository = mockOrgaoRepository();
    repository.existsLocalidade.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new CreateOrgaoService(repository).execute({
      ...props,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.existsLocalidade.mock.calls).toContainEqual([
      orgaoIds.localidadeId,
    ]);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('returns missing locality as not found before organization persistence', async () => {
    const repository = mockOrgaoRepository();
    repository.existsLocalidade.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new CreateOrgaoService(repository).execute({
      ...props,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
      statusCode: 404,
    });
  });
});

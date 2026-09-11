import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validOrgao,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockOrgaoRepository from '@test/mocks/orgaos/adapters/orgao_repository.mock';
import UpdateOrgaoService from '@/modules/orgaos/application/update_orgao.service';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';

describe('UpdateOrgaoService', () => {
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

  it('updates only supplied organization fields including active state', async () => {
    const repository = mockOrgaoRepository();
    const current = OrgaoEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

    const result = await new UpdateOrgaoService(repository).execute({
      id: current.id,
      ativo: false,
      role: UserRole.ADMIN,
    });

    expect(result.getOrThrow()).toMatchObject({
      id: current.id,
      nome: validOrgao.nome,
      ativo: false,
    });
    expect(repository.existsLocalidade.mock.calls).toHaveLength(0);
  });

  it('updates supplied mutable organization fields after destination locality validation', async () => {
    const repository = mockOrgaoRepository();
    const current = OrgaoEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.existsLocalidade.mockResolvedValue(right(true));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

    const result = await new UpdateOrgaoService(repository).execute({
      id: current.id,
      localidadeId: destinationLocalidadeId,
      nome: ' Secretaria Atualizada ',
      sigla: null,
      tipo: null,
      responsavel: ' Ana ',
      email: ' ANA@EXAMPLE.COM ',
      telefone: ' 85988887777 ',
      ativo: false,
      role: UserRole.ADMIN,
    });

    expect(result.getOrThrow()).toMatchObject({
      id: current.id,
      localidadeId: destinationLocalidadeId,
      nome: 'Secretaria Atualizada',
      sigla: null,
      tipo: null,
      responsavel: 'Ana',
      email: 'ana@example.com',
      telefone: '85988887777',
      ativo: false,
    });
    expect(repository.existsLocalidade.mock.calls).toContainEqual([
      destinationLocalidadeId,
    ]);
  });

  it('returns missing organization as not found before update persistence', async () => {
    const repository = mockOrgaoRepository();
    repository.findById.mockResolvedValue(
      left(
        new OrgaoRepositoryException({
          code: ErrorCodeConstants.ORGAO_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new UpdateOrgaoService(repository).execute({
      id: orgaoIds.orgaoId,
      ativo: false,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.existsLocalidade.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_NOT_FOUND,
      statusCode: 404,
    });
  });
});

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import CreateOrgaoService from '@/modules/orgaos/application/create_orgao.service';
import CreateSetorService from '@/modules/orgaos/application/create_setor.service';
import ListOrgaosService from '@/modules/orgaos/application/list_orgaos.service';
import ListSetoresService from '@/modules/orgaos/application/list_setores.service';
import UpdateOrgaoService from '@/modules/orgaos/application/update_orgao.service';
import UpdateSetorService from '@/modules/orgaos/application/update_setor.service';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import OrgaoRepositoryException from '@/modules/orgaos/exceptions/orgao_repository.exception';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validOrgao,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockOrgaoRepository from '@test/mocks/orgaos/adapters/orgao_repository.mock';
import mockSetorRepository from '@test/mocks/orgaos/adapters/setor_repository.mock';

describe('Orgao services', () => {
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
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

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

  it('rejects non-admin organization writes before parent lookup and persistence', async () => {
    const repository = mockOrgaoRepository();

    const result = await new CreateOrgaoService(repository).execute({
      ...props,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.existsLocalidade.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.ORGAO_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
  });

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'allows %s to list organizations',
    async (role) => {
      const repository = mockOrgaoRepository();
      const orgao = OrgaoEntity.create(props);
      repository.findAll.mockResolvedValue(right([orgao]));

      const result = await new ListOrgaosService(repository).execute({ role });

      expect(result.getOrThrow()).toEqual([orgao]);
    },
  );

  it('updates only supplied organization fields including active state', async () => {
    const repository = mockOrgaoRepository();
    const current = OrgaoEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

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
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

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

describe('Setor services', () => {
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
      repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

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

  it('rejects user sector writes before parent lookup and persistence', async () => {
    const repository = mockSetorRepository();

    const result = await new CreateSetorService(repository).execute({
      ...props,
      role: UserRole.USER,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.existsOrgao.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
  });

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'allows %s to list sectors for an existing organization',
    async (role) => {
      const repository = mockSetorRepository();
      const setor = SetorEntity.create(props);
      repository.existsOrgao.mockResolvedValue(right(true));
      repository.findAllByOrgao.mockResolvedValue(right([setor]));

      const result = await new ListSetoresService(repository).execute({
        orgaoId: orgaoIds.orgaoId,
        role,
      });

      expect(result.getOrThrow()).toEqual([setor]);
      expect(repository.existsOrgao.mock.calls).toContainEqual([
        orgaoIds.orgaoId,
      ]);
    },
  );

  it('updates only supplied sector fields including active state', async () => {
    const repository = mockSetorRepository();
    const current = SetorEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

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
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

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

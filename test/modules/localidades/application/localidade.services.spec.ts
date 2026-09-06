import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import CreateLocalidadeService from '@/modules/localidades/application/create_localidade.service';
import ListLocalidadesService from '@/modules/localidades/application/list_localidades.service';
import UpdateLocalidadeService from '@/modules/localidades/application/update_localidade.service';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeRepositoryException from '@/modules/localidades/exceptions/localidade_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  localidadeIds,
  validLocalidade,
} from '@test/constants/localidades/domain/entities/localidade.constants';
import mockLocalidadeRepository from '@test/mocks/localidades/adapters/localidade_repository.mock';

describe('Localidade services', () => {
  const props = {
    nome: validLocalidade.nome,
    uf: validLocalidade.uf,
    codigoIbge: validLocalidade.codigoIbge,
    tipo: validLocalidade.tipo,
    municipio: validLocalidade.municipio,
    observacoes: validLocalidade.observacoes,
  };

  it('allows an admin to create a locality', async () => {
    const repository = mockLocalidadeRepository();
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

    const result = await new CreateLocalidadeService(repository).execute({
      ...props,
      role: UserRole.ADMIN,
    });

    expect(result.getOrThrow()).toMatchObject({
      nome: validLocalidade.nome,
      uf: validLocalidade.uf,
    });
    expect(repository.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({ nome: validLocalidade.nome }),
    );
  });

  it('rejects a non-admin create before persistence', async () => {
    const repository = mockLocalidadeRepository();
    const result = await new CreateLocalidadeService(repository).execute({
      ...props,
      role: UserRole.STAFF,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.save.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
  });

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'allows %s to list localities',
    async (role) => {
      const repository = mockLocalidadeRepository();
      const locality = LocalidadeEntity.create(props);
      repository.findAll.mockResolvedValue(right([locality]));

      const result = await new ListLocalidadesService(repository).execute({ role });

      expect(result.getOrThrow()).toEqual([locality]);
    },
  );

  it('rejects a superadmin list before schema persistence', async () => {
    const repository = mockLocalidadeRepository();
    const result = await new ListLocalidadesService(repository).execute({
      role: UserRole.SUPERADMIN,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.findAll.mock.calls).toHaveLength(0);
    if (result.isRight()) throw new Error('Expected authorization failure');
    expect(result.value.code).toBe(ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN);
  });

  it('updates only supplied fields for an admin', async () => {
    const repository = mockLocalidadeRepository();
    const current = LocalidadeEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));

    const result = await new UpdateLocalidadeService(repository).execute({
      id: current.id,
      municipio: 'Parnaíba',
      role: UserRole.ADMIN,
    });

    expect(result.getOrThrow()).toMatchObject({
      id: current.id,
      nome: validLocalidade.nome,
      municipio: 'Parnaíba',
    });
  });

  it('returns the repository not-found outcome when an admin updates a foreign locality', async () => {
    const repository = mockLocalidadeRepository();
    repository.findById.mockResolvedValue(
      left(
        new LocalidadeRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new UpdateLocalidadeService(repository).execute({
      id: localidadeIds.foreignLocalidadeId,
      municipio: 'Parnaíba',
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

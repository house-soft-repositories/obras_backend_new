import { right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { validLocalidade } from '@test/constants/localidades/domain/entities/localidade.constants';
import mockLocalidadeRepository from '@test/mocks/localidades/adapters/localidade_repository.mock';

import CreateLocalidadeService from '@/modules/localidades/application/create_localidade.service';

describe('CreateLocalidadeService', () => {
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
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

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

  it('persists locality data regardless of caller role', async () => {
    const repository = mockLocalidadeRepository();
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

    const result = await new CreateLocalidadeService(repository).execute({
      ...props,
      role: UserRole.STAFF,
    });

    expect(result.getOrThrow()).toMatchObject({
      nome: validLocalidade.nome,
      uf: validLocalidade.uf,
    });
    expect(repository.save.mock.calls).toHaveLength(1);
  });
});

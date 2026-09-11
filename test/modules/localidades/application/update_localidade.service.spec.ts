import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { validLocalidade } from '@test/constants/localidades/domain/entities/localidade.constants';
import mockLocalidadeRepository from '@test/mocks/localidades/adapters/localidade_repository.mock';

import UpdateLocalidadeService from '@/modules/localidades/application/update_localidade.service';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeRepositoryException from '@/modules/localidades/exceptions/localidade_repository.exception';
import { localidadeIds } from '@test/constants/localidades/domain/entities/localidade.constants';

describe('UpdateLocalidadeService', () => {
  const props = {
    nome: validLocalidade.nome,
    uf: validLocalidade.uf,
    codigoIbge: validLocalidade.codigoIbge,
    tipo: validLocalidade.tipo,
    municipio: validLocalidade.municipio,
    observacoes: validLocalidade.observacoes,
  };

  it('updates only supplied fields for an admin', async () => {
    const repository = mockLocalidadeRepository();
    const current = LocalidadeEntity.create(props);
    repository.findById.mockResolvedValue(right(current));
    repository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );

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

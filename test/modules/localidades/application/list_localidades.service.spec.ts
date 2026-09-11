import { right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { validLocalidade } from '@test/constants/localidades/domain/entities/localidade.constants';
import mockLocalidadeRepository from '@test/mocks/localidades/adapters/localidade_repository.mock';

import ListLocalidadesService from '@/modules/localidades/application/list_localidades.service';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';

describe('ListLocalidadesService', () => {
  const props = {
    nome: validLocalidade.nome,
    uf: validLocalidade.uf,
    codigoIbge: validLocalidade.codigoIbge,
    tipo: validLocalidade.tipo,
    municipio: validLocalidade.municipio,
    observacoes: validLocalidade.observacoes,
  };

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'allows %s to list localities',
    async (role) => {
      const repository = mockLocalidadeRepository();
      const locality = LocalidadeEntity.create(props);
      repository.findAll.mockResolvedValue(right([locality]));

      const result = await new ListLocalidadesService(repository).execute({
        role,
      });

      expect(result.getOrThrow()).toEqual([locality]);
    },
  );

  it('delegates superadmin list requests to the repository', async () => {
    const repository = mockLocalidadeRepository();
    const locality = LocalidadeEntity.create(props);
    repository.findAll.mockResolvedValue(right([locality]));

    const result = await new ListLocalidadesService(repository).execute({
      role: UserRole.SUPERADMIN,
    });

    expect(result.getOrThrow()).toEqual([locality]);
    expect(repository.findAll.mock.calls).toHaveLength(1);
  });
});

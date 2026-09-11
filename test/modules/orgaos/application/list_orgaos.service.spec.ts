import { right } from '@/core/types/either';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validOrgao,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockOrgaoRepository from '@test/mocks/orgaos/adapters/orgao_repository.mock';
import ListOrgaosService from '@/modules/orgaos/application/list_orgaos.service';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';

describe('ListOrgaosService', () => {
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
});

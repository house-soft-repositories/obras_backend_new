import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { right } from '@/core/types/either';
import ListSetoresService from '@/modules/orgaos/application/list_setores.service';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  orgaoIds,
  validOrgao,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockSetorRepository from '@test/mocks/orgaos/adapters/setor_repository.mock';

describe('ListSetoresService', () => {
  const destinationOrgaoId = 'c10c8252-92cf-4d4b-9f20-26e9f451d23a';
  const props = {
    orgaoId: orgaoIds.orgaoId,
    nome: validSetor.nome,
    ativo: validSetor.ativo,
  };

  it.each([UserRole.ADMIN, UserRole.STAFF, UserRole.USER])(
    'allows %s to list sectors for an existing organization',
    async (role) => {
      const repository = mockSetorRepository();
      const readModel: SetorWithOrgaoReadModel = {
        id: 'setor-1',
        nome: validSetor.nome,
        ativo: validSetor.ativo,
        createdAt: new Date(),
        updatedAt: new Date(),
        orgao: { id: orgaoIds.orgaoId, nome: validOrgao.nome },
      };
      const page = new PageEntity(
        [readModel],
        new PageMetaEntity({
          pageOptions: new PageOptionsEntity('ASC', 1, 10),
          itemCount: 1,
        }),
      );
      repository.existsOrgao.mockResolvedValue(right(true));
      repository.findAllByOrgao.mockResolvedValue(right(page));

      const result = await new ListSetoresService(repository).execute({
        role,
      });

      expect(result.getOrThrow().pageData[0].orgao).toEqual({
        id: orgaoIds.orgaoId,
        nome: validOrgao.nome,
      });
      expect(repository.findAllByOrgao.mock.calls).toHaveLength(1);
    },
  );
});

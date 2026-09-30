import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import GetSetorService from '@/modules/orgaos/application/get_setor.service';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorRepositoryException from '@/modules/orgaos/exceptions/setor_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { orgaoIds, validSetor } from '@test/constants/orgaos/domain/entities/orgao_setor.constants';
import mockSetorRepository from '@test/mocks/orgaos/adapters/setor_repository.mock';

describe('GetSetorService', () => {
  it('returns the setor', async () => {
    const repository = mockSetorRepository();
    const entity = SetorEntity.create({ ...validSetor });
    repository.findById.mockResolvedValue(right(entity));

    const result = await new GetSetorService(repository).execute({
      id: entity.id,
      role: UserRole.USER,
    });

    expect(result.getOrThrow()).toMatchObject({ id: entity.id });
    expect(repository.findById).toHaveBeenCalledWith(entity.id);
  });

  it('propagates not-found from the repository', async () => {
    const repository = mockSetorRepository();
    repository.findById.mockResolvedValue(
      left(
        new SetorRepositoryException({
          code: ErrorCodeConstants.SETOR_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new GetSetorService(repository).execute({
      id: orgaoIds.setorId,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('denies read with 403 when role is not setor reader', async () => {
    const repository = mockSetorRepository();

    const result = await new GetSetorService(repository).execute({
      id: orgaoIds.setorId,
      role: UserRole.SUPERADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.SETOR_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
    expect(repository.findById.mock.calls).toHaveLength(0);
  });
});

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import GetLocalidadeService from '@/modules/localidades/application/get_localidade.service';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeRepositoryException from '@/modules/localidades/exceptions/localidade_repository.exception';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import {
  localidadeIds,
  validLocalidade,
} from '@test/constants/localidades/domain/entities/localidade.constants';
import mockLocalidadeRepository from '@test/mocks/localidades/adapters/localidade_repository.mock';

describe('GetLocalidadeService', () => {
  it('returns the localidade', async () => {
    const repository = mockLocalidadeRepository();
    const entity = LocalidadeEntity.create({
      nome: validLocalidade.nome,
      uf: validLocalidade.uf,
      codigoIbge: validLocalidade.codigoIbge,
      tipo: validLocalidade.tipo,
      municipio: validLocalidade.municipio,
      observacoes: validLocalidade.observacoes,
    });
    repository.findById.mockResolvedValue(right(entity));

    const result = await new GetLocalidadeService(repository).execute({
      id: entity.id,
      role: UserRole.USER,
    });

    expect(result.getOrThrow()).toMatchObject({ id: entity.id });
    expect(repository.findById).toHaveBeenCalledWith(entity.id);
  });

  it('propagates not-found from the repository', async () => {
    const repository = mockLocalidadeRepository();
    repository.findById.mockResolvedValue(
      left(
        new LocalidadeRepositoryException({
          code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
          statusCode: 404,
        }),
      ),
    );

    const result = await new GetLocalidadeService(repository).execute({
      id: localidadeIds.foreignLocalidadeId,
      role: UserRole.ADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected not-found failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it('denies read with 403 when role is not reader', async () => {
    const repository = mockLocalidadeRepository();

    const result = await new GetLocalidadeService(repository).execute({
      id: localidadeIds.foreignLocalidadeId,
      role: UserRole.SUPERADMIN,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected forbidden failure');
    expect(result.value).toMatchObject({
      code: ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN,
      statusCode: 403,
    });
    expect(repository.findById.mock.calls).toHaveLength(0);
  });
});

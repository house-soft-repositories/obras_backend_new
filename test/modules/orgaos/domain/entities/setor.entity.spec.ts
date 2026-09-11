import ErrorCodeConstants from '@/core/constants/error_code.constants';
import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorDomainException from '@/modules/orgaos/exceptions/setor_domain.exception';
import {
  orgaoIds,
  validSetor,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';

describe('SetorEntity', () => {
  it('normalizes valid sector data and defaults active state', () => {
    const setor = SetorEntity.create({
      orgaoId: orgaoIds.orgaoId,
      nome: ' Engenharia ',
    });

    expect(setor).toMatchObject({
      orgaoId: orgaoIds.orgaoId,
      nome: 'Engenharia',
      ativo: true,
    });
  });

  it.each([
    {
      props: { nome: '', orgaoId: orgaoIds.orgaoId },
      code: ErrorCodeConstants.SETOR_INVALID_NAME,
    },
    {
      props: { nome: 'Engenharia', orgaoId: 'invalid' },
      code: ErrorCodeConstants.SETOR_INVALID_ORGAO,
    },
  ])('rejects invalid sector data with $code', ({ props, code }) => {
    expect(() => SetorEntity.create(props)).toThrow(
      expect.objectContaining({ code, statusCode: 400 }),
    );
  });

  it('updates only supplied sector fields', () => {
    const current = SetorEntity.create({
      ...validSetor,
    });

    const updated = current.update({ nome: 'Projetos', ativo: false });

    expect(updated).toMatchObject({
      id: current.id,
      orgaoId: orgaoIds.orgaoId,
      nome: 'Projetos',
      ativo: false,
    });
  });
});

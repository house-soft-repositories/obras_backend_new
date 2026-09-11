import ErrorCodeConstants from '@/core/constants/error_code.constants';
import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';
import OrgaoDomainException from '@/modules/orgaos/exceptions/orgao_domain.exception';
import {
  orgaoIds,
  validOrgao,
} from '@test/constants/orgaos/domain/entities/orgao_setor.constants';

describe('OrgaoEntity', () => {
  it('normalizes valid organization data and defaults active state', () => {
    const orgao = OrgaoEntity.create({
      localidadeId: orgaoIds.localidadeId,
      nome: ' Secretaria de Obras ',
      sigla: ' Seob ',
      tipo: TipoOrgao.SECRETARIA,
      responsavel: ' Maria ',
      email: ' GESTAO@EXAMPLE.COM ',
      telefone: ' 85999990000 ',
    });

    expect(orgao).toMatchObject({
      localidadeId: orgaoIds.localidadeId,
      nome: 'Secretaria de Obras',
      sigla: 'Seob',
      tipo: TipoOrgao.SECRETARIA,
      responsavel: 'Maria',
      email: 'gestao@example.com',
      telefone: '85999990000',
      ativo: true,
    });
  });

  it.each([
    {
      props: { nome: '', localidadeId: orgaoIds.localidadeId },
      code: ErrorCodeConstants.ORGAO_INVALID_NAME,
    },
    {
      props: { nome: 'Secretaria', localidadeId: 'invalid' },
      code: ErrorCodeConstants.ORGAO_INVALID_LOCALIDADE,
    },
    {
      props: {
        nome: 'Secretaria',
        localidadeId: orgaoIds.localidadeId,
        tipo: 'ONG',
      },
      code: ErrorCodeConstants.ORGAO_INVALID_TYPE,
    },
    {
      props: {
        nome: 'Secretaria',
        localidadeId: orgaoIds.localidadeId,
        email: 'invalid',
      },
      code: ErrorCodeConstants.ORGAO_INVALID_EMAIL,
    },
  ])('rejects invalid organization data with $code', ({ props, code }) => {
    expect(() =>
      OrgaoEntity.create({
        sigla: null,
        tipo: null,
        responsavel: null,
        email: null,
        telefone: null,
        ...props,
      } as Parameters<typeof OrgaoEntity.create>[0]),
    ).toThrow(expect.objectContaining({ code, statusCode: 400 }));
  });

  it('updates only supplied organization fields', () => {
    const current = OrgaoEntity.create({
      ...validOrgao,
      nome: 'Secretaria',
    });

    const updated = current.update({ sigla: null, ativo: false });

    expect(updated).toMatchObject({
      id: current.id,
      localidadeId: orgaoIds.localidadeId,
      nome: 'Secretaria',
      sigla: null,
      ativo: false,
    });
  });
});

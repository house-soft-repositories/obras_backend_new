import ErrorCodeConstants from '@/core/constants/error_code.constants';
import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';
import LocalidadeDomainException from '@/modules/localidades/exceptions/localidade_domain.exception';
import { validLocalidade } from '@test/constants/localidades/domain/entities/localidade.constants';

describe('LocalidadeEntity', () => {
  it('creates a locality with normalized values and generated identity', () => {
    const locality = LocalidadeEntity.create({
      ...validLocalidade,
      nome: ` ${validLocalidade.nome} `,
      uf: validLocalidade.uf.toLowerCase(),
      municipio: ` ${validLocalidade.municipio} `,
    });

    expect(locality.id).toEqual(expect.any(String));
    expect(locality.nome).toBe('Centro');
    expect(locality.uf).toBe('PI');
    expect(locality.municipio).toBe('Teresina');
    expect(locality.createdAt).toBeInstanceOf(Date);
  });

  it.each([
    [
      'name',
      { ...validLocalidade, nome: '  ' },
      ErrorCodeConstants.LOCALIDADE_INVALID_NAME,
    ],
    [
      'uf',
      { ...validLocalidade, uf: 'P' },
      ErrorCodeConstants.LOCALIDADE_INVALID_UF,
    ],
    [
      'type',
      { ...validLocalidade, tipo: 'CIDADE' as TipoLocalidade },
      ErrorCodeConstants.LOCALIDADE_INVALID_TYPE,
    ],
  ])('rejects invalid %s with its stable error code', (_field, props, code) => {
    expect.assertions(2);
    try {
      LocalidadeEntity.create(props);
    } catch (error) {
      expect(error).toBeInstanceOf(LocalidadeDomainException);
      expect((error as LocalidadeDomainException).code).toBe(code);
    }
  });
});

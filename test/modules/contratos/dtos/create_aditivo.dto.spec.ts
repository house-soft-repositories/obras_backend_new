import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import CriarAditivoDto, {
  AtualizarAditivoDto,
} from '@/modules/contratos/dtos/create_aditivo.dto';
import { TipoAditivo } from '@/modules/contratos/domain/enums/contratos.enums';

describe('Aditivo DTO fontes', () => {
  it('accepts UUID fonteId and numeric-string valor on create', async () => {
    const dto = plainToInstance(CriarAditivoDto, {
      numero: 'AD-001',
      tipo: TipoAditivo.VALOR,
      fontes: [
        {
          fonteId: '550e8400-e29b-41d4-a716-446655440000',
          valor: '1000.00',
        },
      ],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid fonteId and non-numeric valor on update', async () => {
    const dto = plainToInstance(AtualizarAditivoDto, {
      fontes: [{ fonteId: 'fonte-1', valor: 'not-a-number' }],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('fontes');
  });
});

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import DeleteAutoInfracaoService from '@/modules/obras-privadas/application/delete_auto_infracao.service';
import type IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import {
  TipoAutoInfracao,
  SituacaoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type { DeleteAutoInfracaoParam } from '@/modules/obras-privadas/domain/usecase/delete_auto_infracao.usecase';

const makeAutoInfracaoRepo = (): jest.Mocked<IAutoInfracaoRepository> =>
  ({
    findById: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<IAutoInfracaoRepository>;

const makeAuto = () =>
  AutoInfracaoEntity.fromData({
    id: 'auto-1',
    tenantId: 'tenant-1',
    obraPrivadaId: 'obra-1',
    fiscalizacaoId: null,
    numero: 'AI-2026-0001',
    tipo: TipoAutoInfracao.AMBIDESTRO,
    dataEmissao: '2026-01-01',
    prazoDias: 30,
    dataLimite: '2026-02-01',
    baseLegal: 'Lei X',
    descricao: 'Auto de infração',
    valorMulta: '1000.00',
    situacao: SituacaoAutoInfracao.ABERTO,
    dataEncerramento: null,
    observacoes: null,
    lavradoPorUsuarioId: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

describe('DeleteAutoInfracaoService', () => {
  it('deletes existing auto de infração', async () => {
    const autoRepo = makeAutoInfracaoRepo();
    const auto = makeAuto();
    autoRepo.findById.mockResolvedValue(right(auto));
    autoRepo.delete.mockResolvedValue(right(unit));
    const svc = new DeleteAutoInfracaoService(autoRepo);
    const param: DeleteAutoInfracaoParam = {
      id: 'auto-1',
      obraPrivadaId: 'obra-1',
    };
    const result = await svc.execute(param);
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toBe(unit);
    expect(autoRepo.findById).toHaveBeenCalledWith('auto-1');
    expect(autoRepo.delete).toHaveBeenCalledWith('auto-1');
  });

  it('returns not found when auto does not exist', async () => {
    const autoRepo = makeAutoInfracaoRepo();
    autoRepo.findById.mockResolvedValue(right(null));
    const svc = new DeleteAutoInfracaoService(autoRepo);
    const param: DeleteAutoInfracaoParam = {
      id: 'auto-999',
      obraPrivadaId: 'obra-1',
    };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.AUTO_INFRACAO_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('returns not found when auto belongs to different obraPrivada', async () => {
    const autoRepo = makeAutoInfracaoRepo();
    const auto = makeAuto();
    autoRepo.findById.mockResolvedValue(right(auto));
    const svc = new DeleteAutoInfracaoService(autoRepo);
    const param: DeleteAutoInfracaoParam = {
      id: 'auto-1',
      obraPrivadaId: 'obra-999',
    };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.AUTO_INFRACAO_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('propagates repository error on findById', async () => {
    const autoRepo = makeAutoInfracaoRepo();
    autoRepo.findById.mockResolvedValue(left(new Error('db error')));
    const svc = new DeleteAutoInfracaoService(autoRepo);
    const param: DeleteAutoInfracaoParam = {
      id: 'auto-1',
      obraPrivadaId: 'obra-1',
    };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
  });

  it('propagates repository error on delete', async () => {
    const autoRepo = makeAutoInfracaoRepo();
    const auto = makeAuto();
    autoRepo.findById.mockResolvedValue(right(auto));
    autoRepo.delete.mockResolvedValue(left(new Error('db error')));
    const svc = new DeleteAutoInfracaoService(autoRepo);
    const param: DeleteAutoInfracaoParam = {
      id: 'auto-1',
      obraPrivadaId: 'obra-1',
    };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
  });
});

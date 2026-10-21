import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import UpdateAditivoService from '@/modules/contratos/application/update_aditivo.service';
import type IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import { TipoAditivo, TipoPrazoExecucao } from '@/modules/contratos/domain/enums/contratos.enums';
import type { UpdateAditivoParam } from '@/modules/contratos/domain/usecase/update_aditivo.usecase';

const makeAditivoRepo = (): jest.Mocked<IAditivoRepository> =>
  ({
    findById: jest.fn(),
    save: jest.fn(),
  }) as unknown as jest.Mocked<IAditivoRepository>;

const makeAditivo = () =>
  AditivoEntity.fromData({
    id: 'aditivo-1',
    tenantId: 'tenant-1',
    contratoId: 'contrato-1',
    numero: '1',
    tipo: TipoAditivo.VALOR,
    dataAssinatura: '2026-01-01',
    tipoPrazoExecucao: null,
    prazoExecucaoDias: null,
    prazoExecucaoData: null,
    vigenciaAditivada: null,
    observacoes: 'Original',
    fontes: [{ fonteId: 'fonte-1', valor: '1000.00' }],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ordem: 1,
  });

describe('UpdateAditivoService', () => {
  it('updates existing aditivo', async () => {
    const aditivoRepo = makeAditivoRepo();
    const aditivo = makeAditivo();
    aditivoRepo.findById.mockResolvedValue(right(aditivo));
    aditivoRepo.save.mockResolvedValue(right(aditivo));
    const svc = new UpdateAditivoService(aditivoRepo);
    const param: UpdateAditivoParam = { id: 'aditivo-1', observacoes: 'Updated', numero: '2' };
    const result = await svc.execute(param);
    expect(result.isRight()).toBe(true);
    expect(aditivoRepo.findById).toHaveBeenCalledWith('aditivo-1');
    expect(aditivoRepo.save).toHaveBeenCalled();
  });

  it('returns not found when aditivo does not exist', async () => {
    const aditivoRepo = makeAditivoRepo();
    aditivoRepo.findById.mockResolvedValue(right(null));
    const svc = new UpdateAditivoService(aditivoRepo);
    const param: UpdateAditivoParam = { id: 'aditivo-999', observacoes: 'Updated' };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ADITIVO_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('propagates repository error on findById', async () => {
    const aditivoRepo = makeAditivoRepo();
    aditivoRepo.findById.mockResolvedValue(left(new Error('db error')));
    const svc = new UpdateAditivoService(aditivoRepo);
    const param: UpdateAditivoParam = { id: 'aditivo-1', observacoes: 'Updated' };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
  });

  it('propagates repository error on save', async () => {
    const aditivoRepo = makeAditivoRepo();
    const aditivo = makeAditivo();
    aditivoRepo.findById.mockResolvedValue(right(aditivo));
    aditivoRepo.save.mockResolvedValue(left(new Error('db error')));
    const svc = new UpdateAditivoService(aditivoRepo);
    const param: UpdateAditivoParam = { id: 'aditivo-1', observacoes: 'Updated' };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
  });

  it('validates tipoPrazoExecucao when tipo is PRAZO', async () => {
    const aditivoRepo = makeAditivoRepo();
    const aditivo = makeAditivo();
    aditivoRepo.findById.mockResolvedValue(right(aditivo));
    const svc = new UpdateAditivoService(aditivoRepo);
    const param: UpdateAditivoParam = { id: 'aditivo-1', tipo: TipoAditivo.PRAZO };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ADITIVO_INVALID_INPUT);
  });

  it('validates prazoExecucaoDias when tipoPrazoExecucao is DIAS', async () => {
    const aditivoRepo = makeAditivoRepo();
    const aditivo = makeAditivo();
    aditivoRepo.findById.mockResolvedValue(right(aditivo));
    const svc = new UpdateAditivoService(aditivoRepo);
    const param: UpdateAditivoParam = {
      id: 'aditivo-1',
      tipo: TipoAditivo.PRAZO,
      tipoPrazoExecucao: TipoPrazoExecucao.DIAS,
      prazoExecucaoDias: 0,
    };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.ADITIVO_INVALID_INPUT);
  });
});
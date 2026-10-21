import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import DeleteObraService from '@/modules/obras/application/delete_obra.service';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import type { DeleteObraParam } from '@/modules/obras/domain/usecase/delete_obra.usecase';

const makeObraRepo = (): jest.Mocked<IObraRepository> =>
  ({
    findById: jest.fn(),
    softDelete: jest.fn(),
  }) as unknown as jest.Mocked<IObraRepository>;

const makeObra = () =>
  ObraEntity.fromData({
    id: 'obra-1',
    codigo: 'OBR-2026-0001',
    nome: 'Reforma Escola',
    descricao: 'Desc',
    tipo: 'OBRA',
    status: 'PLANEJADA',
    tipoFinanciamento: 'FEDERAL',
    modoDuracao: 'PRAZO_FIXO',
    dataInicio: new Date('2026-01-01'),
    dataPrazo: new Date('2026-12-31'),
    acaoConveniada: false,
    prioritaria: false,
    exibirCameraAoVivo: false,
    cameraUrl: null,
    privado: false,
    invisivel: false,
    considerarSabado: false,
    considerarDomingo: false,
    seguirAutomatico: false,
    vincularPagamentoPercentual: false,
    corresponsaveisPodemEditar: false,
    orgaoId: 'org-1',
    setorId: null,
    localidadeId: 'loc-1',
    subclassificacaoId: null,
    eixoId: null,
    classificacaoId: null,
    tipologiaId: null,
    subtipologiaId: null,
    programaPpa: null,
    acaoEstrategica: null,
    acaoOrcamentaria: null,
    unidadeMedida: null,
    quantidade: null,
    secretario: null,
    dataPactuada: null,
    criadoPorUsuarioId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

describe('DeleteObraService', () => {
  it('deletes existing obra', async () => {
    const obraRepo = makeObraRepo();
    const obra = makeObra();
    obraRepo.findById.mockResolvedValue(right(obra));
    obraRepo.softDelete.mockResolvedValue(right(unit));
    const svc = new DeleteObraService(obraRepo);
    const param: DeleteObraParam = { id: 'obra-1' };
    const result = await svc.execute(param);
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toBe(unit);
    expect(obraRepo.findById).toHaveBeenCalledWith('obra-1');
    expect(obraRepo.softDelete).toHaveBeenCalledWith('obra-1');
  });

  it('returns not found when obra does not exist', async () => {
    const obraRepo = makeObraRepo();
    obraRepo.findById.mockResolvedValue(right(null));
    const svc = new DeleteObraService(obraRepo);
    const param: DeleteObraParam = { id: 'obra-999' };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('propagates repository error on findById', async () => {
    const obraRepo = makeObraRepo();
    obraRepo.findById.mockResolvedValue(left(new Error('db error')));
    const svc = new DeleteObraService(obraRepo);
    const param: DeleteObraParam = { id: 'obra-1' };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
  });

  it('propagates repository error on softDelete', async () => {
    const obraRepo = makeObraRepo();
    const obra = makeObra();
    obraRepo.findById.mockResolvedValue(right(obra));
    obraRepo.softDelete.mockResolvedValue(left(new Error('db error')));
    const svc = new DeleteObraService(obraRepo);
    const param: DeleteObraParam = { id: 'obra-1' };
    const result = await svc.execute(param);
    expect(result.isLeft()).toBe(true);
  });
});
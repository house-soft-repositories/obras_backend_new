import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import CreateObraPrivadaResponsavelService from '@/modules/obras-privadas/application/create_obra_privada_responsavel.service';
import DeleteObraPrivadaResponsavelService from '@/modules/obras-privadas/application/delete_obra_privada_responsavel.service';
import ListObraPrivadaResponsaveisService from '@/modules/obras-privadas/application/list_obra_privada_responsaveis.service';
import UpdateObraPrivadaResponsavelService from '@/modules/obras-privadas/application/update_obra_privada_responsavel.service';
import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import type IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import type IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';

const props = {
  tenantId: 'tenant-id',
  obraPrivadaId: 'obra-id',
  profissionalTecnicoId: 'profissional-id',
  papel: PapelResponsavelTecnico.EXECUCAO,
  tipoDocumento: TipoDocumentoResponsabilidade.ART,
  numeroDocumento: 'ART-123',
  dataDocumento: null,
  arquivoId: null,
  dataInicio: null,
  dataBaixa: null,
  motivoBaixa: null,
};

const entity = () => ObraPrivadaResponsavelEntity.create({ ...props });

const professionalRepository =
  (): jest.Mocked<IProfissionalTecnicoRepository> =>
    ({
      findById: jest.fn().mockResolvedValue(right({})),
    }) as unknown as jest.Mocked<IProfissionalTecnicoRepository>;

const responsavelRepository =
  (): jest.Mocked<IObraPrivadaResponsavelRepository> =>
    ({
      save: jest.fn(),
      findById: jest.fn(),
      findByObraPrivadaId: jest.fn(),
      existsActiveByObraPrivadaIdAndPapel: jest
        .fn()
        .mockResolvedValue(right(false)),
      update: jest.fn(),
      delete: jest.fn(),
    }) as unknown as jest.Mocked<IObraPrivadaResponsavelRepository>;

const updateService = (
  repository: jest.Mocked<IObraPrivadaResponsavelRepository>,
  professionals = professionalRepository(),
) => new UpdateObraPrivadaResponsavelService(repository, professionals);

describe('responsible services', () => {
  it('creates after validating the work and professional', async () => {
    const repository = responsavelRepository();
    const obraRepository = {
      findById: jest
        .fn()
        .mockResolvedValue(right({ toObject: () => ({ deletedAt: null }) })),
    } as unknown as jest.Mocked<IObraPrivadaRepository>;
    const professionalRepository = {
      findById: jest.fn().mockResolvedValue(right({})),
    } as unknown as jest.Mocked<IProfissionalTecnicoRepository>;
    repository.findByObraPrivadaId.mockResolvedValue(right([]));
    repository.save.mockResolvedValue(right(entity()));

    const result = await new CreateObraPrivadaResponsavelService(
      repository,
      obraRepository,
      professionalRepository,
    ).execute(props);

    expect(result.isRight()).toBe(true);
    expect(repository.save).toHaveBeenCalled();
  });

  it('maps unexpected create failures to a 500 unexpected error', async () => {
    const repository = responsavelRepository();
    const obraRepository = {
      findById: jest
        .fn()
        .mockResolvedValue(right({ toObject: () => ({ deletedAt: null }) })),
    } as unknown as jest.Mocked<IObraPrivadaRepository>;
    const professionalRepository = {
      findById: jest.fn().mockResolvedValue(right({})),
    } as unknown as jest.Mocked<IProfissionalTecnicoRepository>;
    repository.findByObraPrivadaId.mockResolvedValue(right([]));
    repository.save.mockRejectedValue(new Error('database down'));

    const result = await new CreateObraPrivadaResponsavelService(
      repository,
      obraRepository,
      professionalRepository,
    ).execute(props);

    expect(result.isLeft()).toBe(true);
    expect(result.value.statusCode).toBe(500);
    expect(result.value.code).toBe('UNEXPECTED_ERROR');
  });

  it('rejects a duplicate current professional and role', async () => {
    const repository = responsavelRepository();
    repository.findByObraPrivadaId.mockResolvedValue(right([entity()]));
    const obraRepository = {
      findById: jest
        .fn()
        .mockResolvedValue(right({ toObject: () => ({ deletedAt: null }) })),
    } as unknown as jest.Mocked<IObraPrivadaRepository>;
    const professionalRepository = {
      findById: jest.fn().mockResolvedValue(right({})),
    } as unknown as jest.Mocked<IProfissionalTecnicoRepository>;

    const result = await new CreateObraPrivadaResponsavelService(
      repository,
      obraRepository,
      professionalRepository,
    ).execute(props);

    expect(result.isLeft()).toBe(true);
    expect(result.value.statusCode).toBe(409);
  });

  it('updates only a responsibility belonging to the requested work', async () => {
    const repository = responsavelRepository();
    const current = entity();
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));
    repository.update.mockResolvedValue(right(current));

    const result = await updateService(repository).execute({
      id: current.id,
      obraPrivadaId: 'another-work',
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validates a changed professional before updating', async () => {
    const repository = responsavelRepository();
    const current = entity();
    const professionals = professionalRepository();
    const changedProfessionalId = 'changed-professional-id';
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));
    repository.update.mockResolvedValue(right(current));
    professionals.findById.mockResolvedValue(right({}));

    const result = await updateService(repository, professionals).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
      profissionalTecnicoId: changedProfessionalId,
    });

    expect(result.isRight()).toBe(true);
    expect(professionals.findById).toHaveBeenCalledWith(changedProfessionalId);
    expect(repository.update).toHaveBeenCalledWith(
      current.id,
      expect.objectContaining({ profissionalTecnicoId: changedProfessionalId }),
    );
  });

  it('rejects an update with a nonexistent professional', async () => {
    const repository = responsavelRepository();
    const current = entity();
    const professionals = professionalRepository();
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));
    professionals.findById.mockResolvedValue(right(null));

    const result = await updateService(repository, professionals).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
      profissionalTecnicoId: 'missing-professional-id',
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('propagates professional repository errors during update', async () => {
    const repository = responsavelRepository();
    const current = entity();
    const professionals = professionalRepository();
    const failure = new Error('professional repository down');
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));
    professionals.findById.mockResolvedValue(left(failure as never));

    const result = await updateService(repository, professionals).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
      profissionalTecnicoId: 'professional-id',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('maps unexpected update failures to a 500 unexpected error', async () => {
    const repository = responsavelRepository();
    const current = entity();
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockRejectedValue(
      new Error('database down'),
    );

    const result = await updateService(repository).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.statusCode).toBe(500);
    expect(result.value.code).toBe('UNEXPECTED_ERROR');
  });

  it('returns a left when domain validation fails during update', async () => {
    const repository = responsavelRepository();
    const current = entity();
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));

    const result = await updateService(repository).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
      dataBaixa: '2026-01-01',
      motivoBaixa: null,
    });

    expect(result.isLeft()).toBe(true);
  });

  it('allows explicit null to clear nullable fields during update', async () => {
    const repository = responsavelRepository();
    const current = ObraPrivadaResponsavelEntity.create({
      ...props,
      arquivoId: 'arquivo-id',
      dataInicio: '2026-01-01',
    });
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));
    repository.update.mockResolvedValue(right(current));

    const result = await updateService(repository).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
      arquivoId: null,
      dataInicio: null,
      dataBaixa: null,
    });

    expect(result.isRight()).toBe(true);
    expect(repository.update).toHaveBeenCalledWith(
      current.id,
      expect.objectContaining({
        arquivoId: null,
        dataInicio: null,
        dataBaixa: null,
        motivoBaixa: null,
      }),
    );
  });

  it('rejects null in mandatory update fields', async () => {
    const repository = responsavelRepository();
    const current = entity();
    repository.findById.mockResolvedValue(right(current));
    repository.findByObraPrivadaId.mockResolvedValue(right([current]));

    const result = await updateService(repository).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
      profissionalTecnicoId: null,
    });

    expect(result.isLeft()).toBe(true);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('preserves history by marking deletion as baixa', async () => {
    const repository = responsavelRepository();
    const current = entity();
    repository.findById.mockResolvedValue(right(current));
    repository.update.mockResolvedValue(right(current));

    const result = await new DeleteObraPrivadaResponsavelService(
      repository,
    ).execute({
      id: current.id,
      obraPrivadaId: props.obraPrivadaId,
    });

    expect(result.isRight()).toBe(true);
    expect(repository.delete).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      current.id,
      expect.objectContaining({ motivoBaixa: expect.any(String) }),
    );
  });

  it('does not overwrite an existing baixa on a repeated delete', async () => {
    const repository = responsavelRepository();
    const current = ObraPrivadaResponsavelEntity.create({
      ...props,
      dataBaixa: '2026-01-01',
      motivoBaixa: 'Histórico preservado',
    });
    repository.findById.mockResolvedValue(right(current));

    const result = await new DeleteObraPrivadaResponsavelService(
      repository,
    ).execute({ id: current.id, obraPrivadaId: props.obraPrivadaId });

    expect(result.isRight()).toBe(true);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('lists responsibilities by work', async () => {
    const repository = responsavelRepository();
    repository.findByObraPrivadaId.mockResolvedValue(right([entity()]));

    const result = await new ListObraPrivadaResponsaveisService(
      repository,
    ).execute({
      obraPrivadaId: props.obraPrivadaId,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value.fromResponse()).toHaveLength(1);
    expect(repository.findByObraPrivadaId).toHaveBeenCalledWith(
      props.obraPrivadaId,
    );
  });
});

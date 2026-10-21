import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import IComentarioRepository from '@/modules/cronograma/adapters/comentario_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import IComentariosUseCase, {
  CreateComentarioParam,
  ListComentariosParam,
  UpdateComentarioParam,
} from '@/modules/cronograma/domain/usecase/comentarios.usecase';

export default class ComentariosService implements IComentariosUseCase {
  constructor(
    private readonly repo: IComentarioRepository,
    private readonly tc: TenantContext,
    private readonly obras: IObraRepository,
    private readonly estagioRepo: IEstagioRepository,
  ) {}

  private async ensureObra(obraId: string): AsyncResult<AppException, Unit> {
    const obra = await this.obras.findById(obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(unit);
  }

  private async ensureEstagio(
    obraId: string,
    estagioId: string,
  ): AsyncResult<AppException, EstagioEntity> {
    const obraOk = await this.ensureObra(obraId);
    if (obraOk.isLeft()) return left(obraOk.value);
    const found = await this.estagioRepo.findById(estagioId, obraId);
    if (found.isLeft()) return left(found.value);
    if (!found.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(found.value);
  }

  async create(
    p: CreateComentarioParam,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    const found = await this.ensureEstagio(p.obraId, p.estagioId);
    if (found.isLeft()) return left(found.value);

    try {
      return this.repo.save(
        EstagioComentarioEntity.create({
          tenantId: this.tc.require().tenantId,
          obraId: p.obraId,
          estagioId: p.estagioId,
          texto: p.texto,
          autorUsuarioId: p.autorUsuarioId,
        }),
      );
    } catch (e) {
      if (e instanceof AppException) return left(e);
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_SERVICE_FAILED,
          cause: e,
        }),
      );
    }
  }

  async get(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    const found = await this.ensureEstagio(obraId, estagioId);
    if (found.isLeft()) return left(found.value);
    return this.repo.findById(obraId, estagioId, id);
  }

  async list(
    p: ListComentariosParam,
  ): AsyncResult<AppException, EstagioComentarioEntity[]> {
    const found = await this.ensureEstagio(p.obraId, p.estagioId);
    if (found.isLeft()) return left(found.value);
    return this.repo.list(p.obraId, p.estagioId);
  }

  async update(
    p: UpdateComentarioParam,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    const found = await this.get(p.obraId, p.estagioId, p.id);
    if (found.isLeft()) return left(found.value);
    try {
      return this.repo.update(found.value.update({ texto: p.texto }));
    } catch (e) {
      if (e instanceof AppException) return left(e);
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_SERVICE_FAILED,
          cause: e,
        }),
      );
    }
  }

  async remove(
    obraId: string,
    estagioId: string,
    id: string,
  ): AsyncResult<AppException, Unit> {
    const found = await this.ensureEstagio(obraId, estagioId);
    if (found.isLeft()) return left(found.value);
    return this.repo.remove(obraId, estagioId, id);
  }
}

import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import {
  CreateAcompanhamentoParam,
  CreateComentarioParam,
  CreateEstagioParam,
  IEstagiosUseCase,
  UpdateEstagioParam,
} from '@/modules/cronograma/domain/usecase/estagios.usecase';
import TenantContext from '@/core/multitenancy/tenant_context';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
export default class EstagiosService implements IEstagiosUseCase {
  constructor(
    private readonly repo: IEstagioRepository,
    private readonly tc: TenantContext,
    private readonly obras: IObraRepository,
  ) {}
  private async ensureObra(obraId: string): AsyncResult<AppException, void> {
    const obra = await this.obras.findById(obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    return right(undefined);
  }
  async create(
    p: CreateEstagioParam,
  ): AsyncResult<AppException, EstagioEntity> {
    const ok = await this.ensureObra(p.obraId);
    if (ok.isLeft()) return left(ok.value);
    try {
      return this.repo.save(
        EstagioEntity.create({
          tenantId: this.tc.require().tenantId,
          obraId: p.obraId,
          nome: p.nome,
          posicao: p.posicao ?? 0,
          dataInicio: p.dataInicio,
          dataFim: p.dataFim,
          responsavelUsuarioId: p.responsavelUsuarioId,
        }),
      );
    } catch (e) {
      return left(e as AppException);
    }
  }
  async createMany(
    obraId: string,
    items: CreateEstagioParam[],
  ): AsyncResult<AppException, EstagioEntity[]> {
    const ok = await this.ensureObra(obraId);
    if (ok.isLeft()) return left(ok.value);
    try {
      const tenantId = this.tc.require().tenantId;
      return this.repo.saveMany(
        items.map((item, index) =>
          EstagioEntity.create({
            tenantId,
            obraId,
            nome: item.nome,
            posicao: item.posicao ?? index,
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            responsavelUsuarioId: item.responsavelUsuarioId,
          }),
        ),
      );
    } catch (e) {
      return left(e as AppException);
    }
  }
  async list(
    obraId: string,
    o: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EstagioEntity>> {
    const ok = await this.ensureObra(obraId);
    if (ok.isLeft()) return left(ok.value);
    return this.repo.list(obraId, o);
  }
  async get(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, EstagioEntity> {
    const ok = await this.ensureObra(obraId);
    if (ok.isLeft()) return left(ok.value);
    return this.repo.findById(id, obraId);
  }
  async update(
    p: UpdateEstagioParam,
  ): AsyncResult<AppException, EstagioEntity> {
    const found = await this.get(p.obraId, p.id);
    if (found.isLeft()) return left(found.value);
    try {
      return this.repo.update(found.value.update(p));
    } catch (e) {
      return left(e as AppException);
    }
  }
  async remove(obraId: string, id: string): AsyncResult<AppException, void> {
    const ok = await this.ensureObra(obraId);
    if (ok.isLeft()) return left(ok.value);
    return this.repo.remove(id, obraId);
  }
  async reorder(
    obraId: string,
    items: { id: string; posicao: number }[],
  ): AsyncResult<AppException, void> {
    const ok = await this.ensureObra(obraId);
    if (ok.isLeft()) return left(ok.value);
    return this.repo.reorder(obraId, items);
  }
  async predefinidos(): AsyncResult<
    AppException,
    { nome: string; posicao: number }[]
  > {
    return right(
      ['Projeto', 'Fundação', 'Estrutura', 'Acabamento', 'Entrega'].map(
        (nome, posicao) => ({ nome, posicao }),
      ),
    );
  }

  async createAcompanhamento(
    p: CreateAcompanhamentoParam,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity> {
    const found = await this.get(p.obraId, p.estagioId);
    if (found.isLeft()) return left(found.value);
    try {
      return this.repo.saveAcompanhamento(
        EstagioAcompanhamentoEntity.create({
          tenantId: this.tc.require().tenantId,
          obraId: p.obraId,
          estagioId: p.estagioId,
          percentual: p.percentual,
          data: p.data,
          observacao: p.observacao,
          autorUsuarioId: p.autorUsuarioId,
        }),
      );
    } catch (e) {
      return left(e as AppException);
    }
  }

  async createComentario(
    p: CreateComentarioParam,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    const found = await this.get(p.obraId, p.estagioId);
    if (found.isLeft()) return left(found.value);
    try {
      return this.repo.saveComentario(
        EstagioComentarioEntity.create({
          tenantId: this.tc.require().tenantId,
          obraId: p.obraId,
          estagioId: p.estagioId,
          texto: p.texto,
          autorUsuarioId: p.autorUsuarioId,
        }),
      );
    } catch (e) {
      return left(e as AppException);
    }
  }

  async updatePercentualDireto(
    obraId: string,
    id: string,
    percentual: number,
  ): AsyncResult<AppException, EstagioEntity> {
    if (percentual < 0 || percentual > 100) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
          statusCode: 400,
        }),
      );
    }
    const found = await this.get(obraId, id);
    if (found.isLeft()) return left(found.value);
    return this.repo.updatePercentualDireto(obraId, id, percentual);
  }

  async datasAgregadas(
    obraId: string,
  ): AsyncResult<
    AppException,
    { dataInicio: string | null; dataFim: string | null }
  > {
    const ok = await this.ensureObra(obraId);
    if (ok.isLeft()) return left(ok.value);
    return this.repo.datasAgregadas(obraId);
  }
}

import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import {
  CreateMedicaoParam,
  IMedicoesUseCase,
  MedicaoFonteParam,
  UpdateMedicaoParam,
} from '@/modules/cronograma/domain/usecase/medicoes.usecase';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';

export default class MedicoesService implements IMedicoesUseCase {
  constructor(
    private readonly repo: IMedicaoRepository,
    private readonly tc: TenantContext,
    private readonly obras: IObraRepository,
    private readonly fontes: IFonteRepository,
  ) {}

  async create(
    param: CreateMedicaoParam,
  ): AsyncResult<AppException, MedicaoEntity> {
    const obra = await this.ensureObra(param.obraId);
    if (obra.isLeft()) return left(obra.value);
    const fontes = await this.ensureFontes(param.fontes);
    if (fontes.isLeft()) return left(fontes.value);
    const duplicated = await this.ensureNormalNumeroAvailable(
      param.obraId,
      param.numero,
      param.tipo,
    );
    if (duplicated.isLeft()) return left(duplicated.value);
    try {
      return this.repo.save(
        MedicaoEntity.create({
          tenantId: this.tc.require().tenantId,
          obraId: param.obraId,
          orgaoId: param.orgaoId,
          numero: param.numero,
          tipo: param.tipo,
          dataMedicao: param.dataMedicao,
          observacao: param.observacoes,
          itens: param.fontes,
        }),
      );
    } catch (error) {
      return left(error as AppException);
    }
  }

  async list(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>> {
    const obra = await this.ensureObra(obraId);
    if (obra.isLeft()) return left(obra.value);
    return this.repo.list(obraId, options);
  }

  async get(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, MedicaoEntity> {
    const obra = await this.ensureObra(obraId);
    if (obra.isLeft()) return left(obra.value);
    return this.repo.findById(id, obraId);
  }

  async update(
    param: UpdateMedicaoParam,
  ): AsyncResult<AppException, MedicaoEntity> {
    const found = await this.get(param.obraId, param.id);
    if (found.isLeft()) return left(found.value);
    if (param.fontes) {
      const fontes = await this.ensureFontes(param.fontes);
      if (fontes.isLeft()) return left(fontes.value);
    }
    const tipo = param.tipo ?? found.value.tipo;
    const numero = param.numero ?? found.value.numero;
    const duplicated = await this.ensureNormalNumeroAvailable(
      param.obraId,
      numero,
      tipo,
      param.id,
    );
    if (duplicated.isLeft()) return left(duplicated.value);
    try {
      return this.repo.update(
        found.value.update({
          numero: param.numero,
          orgaoId: param.orgaoId,
          tipo: param.tipo,
          dataMedicao: param.dataMedicao,
          observacao: param.observacoes,
          itens: param.fontes,
        }),
      );
    } catch (error) {
      return left(error as AppException);
    }
  }

  async remove(obraId: string, id: string): AsyncResult<AppException, void> {
    const found = await this.get(obraId, id);
    if (found.isLeft()) return left(found.value);
    return this.repo.remove(id, obraId);
  }

  private async ensureObra(obraId: string): AsyncResult<AppException, void> {
    const obra = await this.obras.findById(obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(undefined);
  }

  private async ensureFontes(
    itens: MedicaoFonteParam[],
  ): AsyncResult<AppException, void> {
    for (const item of itens) {
      const fonte = await this.fontes.findById(item.fonteId);
      if (fonte.isLeft()) return left(fonte.value);
      if (!fonte.value?.ativo) {
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.MEDICAO_FONTE_INVALIDA,
            statusCode: 422,
          }),
        );
      }
    }
    return right(undefined);
  }

  private async ensureNormalNumeroAvailable(
    obraId: string,
    numero: number,
    tipo: TipoMedicao,
    ignoreId?: string,
  ): AsyncResult<AppException, void> {
    if (tipo !== TipoMedicao.NORMAL) return right(undefined);
    const exists = await this.repo.existsNormalNumero(obraId, numero, ignoreId);
    if (exists.isLeft()) return left(exists.value);
    if (!exists.value) return right(undefined);
    return left(
      new CronogramaRepositoryException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
        statusCode: 409,
      }),
    );
  }
}

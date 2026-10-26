import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import { withManager } from '@/core/multitenancy/tenant_manager';
import { DataSource } from 'typeorm';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import IUpdateMedicaoUseCase, {
  UpdateMedicaoParam,
} from '@/modules/cronograma/domain/usecase/update_medicao.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';

export default class UpdateMedicaoService implements IUpdateMedicaoUseCase {
  constructor(
    private readonly repo: IMedicaoRepository,
    private readonly tc: TenantContext,
    private readonly obras: IObraRepository,
    private readonly fontes: IFonteRepository,
    private readonly ds?: DataSource,
  ) {}

  async execute(
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
      if (!this.ds)
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
      return await withManager(this.ds, this.tc, async (manager) => {
        await manager.getRepository(ObraModel).findOne({
          where: { id: param.obraId },
          lock: { mode: 'pessimistic_write' },
        });
        const saldo = await this.repo.getSaldoMedicao(
          param.obraId,
          param.id,
          manager,
        );
        if (saldo.isLeft()) return left(saldo.value);
        const valorMedicao = (param.fontes ?? found.value.itens).reduce(
          (total, item) => total + item.valor,
          0,
        );
        if (
          Number(saldo.value.medicoesAcumuladas) + valorMedicao >
          Number(saldo.value.orcamentoTotal)
        )
          return left(
            new CronogramaServiceException({
              code: ErrorCodeConstants.MEDICAO_ORCAMENTO_EXCEDIDO,
              statusCode: 422,
            }),
          );
        return this.repo.update(
          found.value.update({
            numero: param.numero,
            orgaoId: param.orgaoId,
            tipo: param.tipo,
            dataMedicao: param.dataMedicao,
            observacao: param.observacoes,
            itens: param.fontes,
          }),
          manager,
        );
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_SERVICE_FAILED,
          cause: error,
        }),
      );
    }
  }

  private async get(
    obraId: string,
    id: string,
  ): AsyncResult<AppException, MedicaoEntity> {
    const obra = await this.ensureObra(obraId);
    if (obra.isLeft()) return left(obra.value);
    return this.repo.findById(obraId, id);
  }

  private async ensureObra(obraId: string): AsyncResult<AppException, Unit> {
    const obra = await this.obras.findById(obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value) {
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );
    }
    return right(unit);
  }

  private async ensureFontes(
    itens: { fonteId: string; valor: number }[],
  ): AsyncResult<AppException, Unit> {
    for (const item of itens) {
      const fonte = await this.fontes.findById(item.fonteId);
      if (fonte.isLeft()) return left(fonte.value);
      if (!fonte.value?.ativo) {
        return left(
          new CronogramaServiceException({
            code: ErrorCodeConstants.MEDICAO_FONTE_INVALIDA,
            statusCode: 422,
          }),
        );
      }
    }
    return right(unit);
  }

  private async ensureNormalNumeroAvailable(
    obraId: string,
    numero: number,
    tipo: TipoMedicao,
    ignoreId?: string,
  ): AsyncResult<AppException, Unit> {
    if (tipo !== TipoMedicao.NORMAL) return right(unit);
    const exists = await this.repo.existsNormalNumero(obraId, numero, ignoreId);
    if (exists.isLeft()) return left(exists.value);
    if (!exists.value) return right(unit);
    return left(
      new CronogramaServiceException({
        code: ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT,
        statusCode: 409,
      }),
    );
  }
}

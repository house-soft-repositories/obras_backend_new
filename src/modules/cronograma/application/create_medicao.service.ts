import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import TenantContext from '@/core/multitenancy/tenant_context';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import ICreateMedicaoUseCase, {
  CreateMedicaoParam,
} from '@/modules/cronograma/domain/usecase/create_medicao.usecase';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';

export default class CreateMedicaoService implements ICreateMedicaoUseCase {
  constructor(
    private readonly repo: IMedicaoRepository,
    private readonly tc: TenantContext,
    private readonly obras: IObraRepository,
    private readonly fontes: IFonteRepository,
  ) {}

  async execute(
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
      if (error instanceof AppException) return left(error);
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_SERVICE_FAILED,
          cause: error,
        }),
      );
    }
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
  ): AsyncResult<AppException, Unit> {
    if (tipo !== TipoMedicao.NORMAL) return right(unit);
    const exists = await this.repo.existsNormalNumero(obraId, numero);
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

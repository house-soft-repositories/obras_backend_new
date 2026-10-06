import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import ContratoEntity from '@/modules/contratos/domain/entities/contrato.entity';
import IUpdateContratoUseCase, {
  UpdateContratoParam,
} from '@/modules/contratos/domain/usecase/update_contrato.usecase';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoServiceException from '@/modules/contratos/exceptions/contrato_service.exception';
import GetContratoService from '@/modules/contratos/application/get_contrato.service';

export default class UpdateContratoService implements IUpdateContratoUseCase {
  private readonly getter: GetContratoService;

  constructor(
    private readonly contratoRepo: IContratoRepository,
    private readonly empresaRepo: IEmpresaContratadaRepository,
  ) {
    this.getter = new GetContratoService(contratoRepo);
  }

  async execute(
    param: UpdateContratoParam,
  ): AsyncResult<AppException, ContratoEntity> {
    try {
      const found = await this.getter.execute({ id: param.id });
      if (found.isLeft()) return left(found.value);
      const previous = found.value.toObject();

      if (param.empresaContratadaId) {
        const emp = await this.empresaRepo.findById(
          param.empresaContratadaId,
        );
        if (emp.isLeft()) return left(emp.value);
        if (!emp.value) {
          return left(
            new ContratoRepositoryException({
              code: ErrorCodeConstants.EMPRESA_CONTRATADA_NOT_FOUND,
              statusCode: 404,
            }),
          );
        }
      }

      const next = ContratoEntity.fromData({
        ...previous,
        empresaContratadaId:
          param.empresaContratadaId ?? previous.empresaContratadaId,
        numero: param.numero?.trim() ?? previous.numero,
        objeto:
          param.objeto !== undefined
            ? param.objeto?.trim() || null
            : previous.objeto,
        dataAssinatura:
          param.dataAssinatura !== undefined
            ? param.dataAssinatura
            : previous.dataAssinatura,
        fimVigencia:
          param.fimVigencia !== undefined
            ? param.fimVigencia
            : previous.fimVigencia,
        dataOs: param.dataOs ?? previous.dataOs,
        tipoPrazoExecucao: param.tipoPrazoExecucao ?? previous.tipoPrazoExecucao,
        prazoExecucaoDias:
          param.prazoExecucaoDias !== undefined
            ? param.prazoExecucaoDias
            : previous.prazoExecucaoDias,
        prazoExecucaoData:
          param.prazoExecucaoData !== undefined
            ? param.prazoExecucaoData
            : previous.prazoExecucaoData,
        fontes: param.fontes ?? previous.fontes,
        updatedAt: new Date(),
      });

      return this.contratoRepo.save(next);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ContratoServiceException({
          code: ErrorCodeConstants.CONTRATO_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}

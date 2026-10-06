import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IAditivoRepository from '@/modules/contratos/adapters/aditivo_repository.interface';
import IContratoRepository from '@/modules/contratos/adapters/contrato_repository.interface';
import IParalisacaoRepository from '@/modules/contratos/adapters/paralisacao_repository.interface';
import { calcularPrazoFinalExecucao } from '@/modules/contratos/domain/calculo_prazo_execucao';
import IGetPrazoFinalContratoUseCase, {
  GetPrazoFinalContratoParam,
  PrazoFinalContratoResult,
} from '@/modules/contratos/domain/usecase/get_prazo_final_contrato.usecase';
import ContratoRepositoryException from '@/modules/contratos/exceptions/contrato_repository.exception';
import ContratoServiceException from '@/modules/contratos/exceptions/contrato_service.exception';

export default class GetPrazoFinalContratoService
  implements IGetPrazoFinalContratoUseCase
{
  constructor(
    private readonly contratoRepo: IContratoRepository,
    private readonly aditivoRepo: IAditivoRepository,
    private readonly paralisacaoRepo: IParalisacaoRepository,
  ) {}

  async execute(
    param: GetPrazoFinalContratoParam,
  ): AsyncResult<AppException, PrazoFinalContratoResult> {
    try {
      const contratoRes = await this.contratoRepo.findById(param.id);
      if (contratoRes.isLeft()) return left(contratoRes.value);
      if (!contratoRes.value) {
        return left(
          new ContratoRepositoryException({
            code: ErrorCodeConstants.CONTRATO_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      const contrato = contratoRes.value;

      const aditivosRes = await this.aditivoRepo.listByContrato(param.id);
      const paralisacoesRes =
        await this.paralisacaoRepo.listByContrato(param.id);
      const calendarioRes = await this.contratoRepo.getObraCalendario(
        contrato.obraId,
      );
      if (calendarioRes.isLeft()) return left(calendarioRes.value);

      const considerarSabado = calendarioRes.value?.considerarSabado ?? false;
      const considerarDomingo = calendarioRes.value?.considerarDomingo ?? false;

      const result = calcularPrazoFinalExecucao({
        dataOs: contrato.dataOs,
        tipoPrazoExecucao: contrato.tipoPrazoExecucao,
        prazoExecucaoDias: contrato.prazoExecucaoDias,
        prazoExecucaoData: contrato.prazoExecucaoData,
        paralisacoes: (paralisacoesRes.isRight()
          ? paralisacoesRes.value
          : []
        ).map((p) => ({
          dataParalisacao: p.dataParalisacao,
          diasParados: p.diasParados ?? null,
          dataReinicio: p.dataReinicio ?? null,
        })),
        aditivos: (aditivosRes.isRight() ? aditivosRes.value : []).map(
          (a) => ({
            tipo: a.tipo,
            tipoPrazoExecucao: a.tipoPrazoExecucao ?? null,
            prazoExecucaoDias: a.prazoExecucaoDias ?? null,
            prazoExecucaoData: a.prazoExecucaoData ?? null,
          }),
        ),
        considerarSabado,
        considerarDomingo,
        dataReferencia: new Date().toISOString().slice(0, 10),
      });

      return right(result);
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

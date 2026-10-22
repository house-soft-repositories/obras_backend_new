import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import CronogramaServiceException from '@/modules/cronograma/exceptions/cronograma_service.exception';
import { TipoFinanciamento } from '@/modules/obras/domain/enums/tipo_financiamento.enum';
import { ModoDuracao } from '@/modules/cronograma/domain/enums/cronograma.enums';
import IPredefinidosUseCase, {
  CreatePredefinidosParam,
  GetPredefinidosParam,
  PredefinidoTemplate,
} from '@/modules/cronograma/domain/usecase/predefinidos.usecase';

export default class PredefinidosService implements IPredefinidosUseCase {
  constructor(
    private readonly repo: IEstagioRepository,
    private readonly tc: TenantContext,
    private readonly obras: IObraRepository,
  ) {}

  private getTemplatesForTipoFinanciamento(
    tipoFinanciamento: string,
  ): PredefinidoTemplate[] {
    const templates: Record<string, PredefinidoTemplate[]> = {
      [TipoFinanciamento.COM_OGU]: [
        {
          nome: 'EM LICITACAO',
          posicao: 0,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'CONTRATADA',
          posicao: 1,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'ORDEM DE SERVICO',
          posicao: 2,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'EM EXECUCAO',
          posicao: 3,
          modoDuracao: ModoDuracao.DIAS_CORRIDOS,
        },
        { nome: 'MEDICAO', posicao: 4, modoDuracao: ModoDuracao.DIAS_CORRIDOS },
        {
          nome: 'PRESTACAO DE CONTAS',
          posicao: 5,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'CONCLUIDA',
          posicao: 6,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
      ],
      [TipoFinanciamento.SEM_OGU]: [
        {
          nome: 'EM LICITACAO',
          posicao: 0,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'CONTRATADA',
          posicao: 1,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'ORDEM DE SERVICO',
          posicao: 2,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'EM EXECUCAO',
          posicao: 3,
          modoDuracao: ModoDuracao.DIAS_CORRIDOS,
        },
        {
          nome: 'CONCLUIDA',
          posicao: 4,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
      ],
      [TipoFinanciamento.INVESTIMENTO_PRIVADO]: [
        { nome: 'PROJETO', posicao: 0, modoDuracao: ModoDuracao.NAO_INFORMADO },
        {
          nome: 'LICENCIAMENTO',
          posicao: 1,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
        {
          nome: 'EM EXECUCAO',
          posicao: 2,
          modoDuracao: ModoDuracao.DIAS_CORRIDOS,
        },
        {
          nome: 'CONCLUIDA',
          posicao: 3,
          modoDuracao: ModoDuracao.NAO_INFORMADO,
        },
      ],
    };

    return templates[tipoFinanciamento] ?? [];
  }

  async getTemplate(
    p: GetPredefinidosParam,
  ): AsyncResult<AppException, PredefinidoTemplate[]> {
    const obra = await this.obras.findById(p.obraId);
    if (obra.isLeft()) return left(obra.value);
    if (!obra.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );

    const tipoFinanciamento =
      p.tipoFinanciamento ?? obra.value.tipoFinanciamento;

    const templates = this.getTemplatesForTipoFinanciamento(tipoFinanciamento);
    return right(templates);
  }

  async create(
    p: CreatePredefinidosParam,
  ): AsyncResult<AppException, EstagioEntity[]> {
    const ok = await this.obras.findById(p.obraId);
    if (ok.isLeft()) return left(ok.value);
    if (!ok.value)
      return left(
        new CronogramaServiceException({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
          statusCode: 404,
        }),
      );

    const templates = this.getTemplatesForTipoFinanciamento(
      ok.value.tipoFinanciamento,
    );
    if (templates.length === 0) {
      return right([]);
    }

    try {
      const raizes = await this.repo.listRootEstagios(p.obraId);
      if (raizes.isLeft()) return left(raizes.value);
      let ordem =
        raizes.value.reduce((max, e) => Math.max(max, e.posicao), -1) + 1;
      const tenantId = this.tc.require().tenantId;
      const estagios = templates.map((template) => {
        const estagio = EstagioEntity.create({
          tenantId,
          obraId: p.obraId,
          nome: template.nome,
          posicao: ordem,
          modoDuracao: template.modoDuracao,
          responsavelUsuarioId: p.autorUsuarioId,
        });
        ordem += 1;
        return estagio;
      });
      const saved = await this.repo.saveMany(estagios);
      if (saved.isLeft()) return left(saved.value);
      return right(saved.value);
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
}

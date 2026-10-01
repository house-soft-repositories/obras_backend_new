import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type IAtualizarObraUseCase from '@/modules/obras-privadas/domain/usecase/atualizar_obra.usecase';
import type ICreateObraPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada.usecase';
import type IDetalharObraUseCase from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import type IExcluirObraUseCase from '@/modules/obras-privadas/domain/usecase/excluir_obra.usecase';
import type IListarAutosGlobalUseCase from '@/modules/obras-privadas/domain/usecase/listar_autos_global.usecase';
import type IListarFiscalizacoesGlobalUseCase from '@/modules/obras-privadas/domain/usecase/listar_fiscalizacoes_global.usecase';
import type IListarLicenciamentoUseCase from '@/modules/obras-privadas/domain/usecase/listar_licenciamento.usecase';
import type IListObraPrivadaEtapasUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_etapas.usecase';
import type IListObraPrivadaTimelineUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_timeline.usecase';
import type IListarObrasUseCase from '@/modules/obras-privadas/domain/usecase/listar_obras.usecase';
import type IListObrasNoMesmoImovelUseCase from '@/modules/obras-privadas/domain/usecase/list_obras_no_mesmo_imovel.usecase';
import type IResumirAutosUseCase from '@/modules/obras-privadas/domain/usecase/resumir_autos.usecase';
import CreateObraPrivadaDto from '@/modules/obras-privadas/dtos/create_obra_privada.dto';
import ListAutosGlobalQueryDto from '@/modules/obras-privadas/dtos/list_autos_global_query.dto';
import ListFiscalizacoesGlobalQueryDto from '@/modules/obras-privadas/dtos/list_fiscalizacoes_global_query.dto';
import ListLicenciamentoQueryDto from '@/modules/obras-privadas/dtos/list_licenciamento_query.dto';
import ListObrasQueryDto from '@/modules/obras-privadas/dtos/list_obras_query.dto';
import ObraPrivadaDetalheResponseDto from '@/modules/obras-privadas/dtos/obra_privada_detalhe_response.dto';
import ObraPrivadaResponseDto from '@/modules/obras-privadas/dtos/obra_privada_response.dto';
import UpdateObraPrivadaDto from '@/modules/obras-privadas/dtos/update_obra_privada.dto';
import {
  ATUALIZAR_OBRA_SERVICE,
  CREATE_OBRA_PRIVADA_SERVICE,
  DETALHAR_OBRA_SERVICE,
  EXCLUIR_OBRA_SERVICE,
  LISTAR_AUTOS_GLOBAL_SERVICE,
  LISTAR_FISCALIZACOES_GLOBAL_SERVICE,
  LISTAR_LICENCIAMENTO_SERVICE,
  LISTAR_OBRAS_SERVICE,
  LIST_OBRA_PRIVADA_ETAPAS_SERVICE,
  LIST_OBRA_PRIVADA_TIMELINE_SERVICE,
  LIST_OBRAS_NO_MESMO_IMOVEL_SERVICE,
  RESUMIR_AUTOS_SERVICE,
} from '@/modules/obras-privadas/symbols';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras-privadas')
@UseGuards(AccessTokenGuard)
export default class ObraPrivadaController {
  constructor(
    @Inject(CREATE_OBRA_PRIVADA_SERVICE)
    private readonly svc: ICreateObraPrivadaUseCase,
    @Inject(LISTAR_OBRAS_SERVICE)
    private readonly listarObras: IListarObrasUseCase,
    @Inject(DETALHAR_OBRA_SERVICE)
    private readonly detalharObra: IDetalharObraUseCase,
    @Inject(ATUALIZAR_OBRA_SERVICE)
    private readonly atualizarObra: IAtualizarObraUseCase,
    @Inject(EXCLUIR_OBRA_SERVICE)
    private readonly excluirObra: IExcluirObraUseCase,
    @Inject(LISTAR_FISCALIZACOES_GLOBAL_SERVICE)
    private readonly listarFiscalizacoesGlobal: IListarFiscalizacoesGlobalUseCase,
    @Inject(LISTAR_AUTOS_GLOBAL_SERVICE)
    private readonly listarAutosGlobal: IListarAutosGlobalUseCase,
    @Inject(RESUMIR_AUTOS_SERVICE)
    private readonly resumirAutos: IResumirAutosUseCase,
    @Inject(LISTAR_LICENCIAMENTO_SERVICE)
    private readonly listarLicenciamento: IListarLicenciamentoUseCase,
    @Inject(LIST_OBRAS_NO_MESMO_IMOVEL_SERVICE)
    private readonly noMesmoImovelSvc: IListObrasNoMesmoImovelUseCase,
    @Inject(LIST_OBRA_PRIVADA_ETAPAS_SERVICE)
    private readonly etapasSvc: IListObraPrivadaEtapasUseCase,
    @Inject(LIST_OBRA_PRIVADA_TIMELINE_SERVICE)
    private readonly timelineSvc: IListObraPrivadaTimelineUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post() async createObraPrivada(
    @Body() b: CreateObraPrivadaDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const tenantId = (u as any)?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const r = await this.svc.execute({ ...b, tenantId });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraPrivadaResponseDto.fromEntity(r.value);
    });
  }

  @Get() async listar(
    @Query() q: ListObrasQueryDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.listarObras.execute({ ...q });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return { data: r.value.pageData, meta: r.value.pageMeta };
    });
  }

  @Get('fiscalizacoes') async listarFiscalizacoes(
    @Query() q: ListFiscalizacoesGlobalQueryDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.listarFiscalizacoesGlobal.execute({ ...q });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return { data: r.value.pageData, meta: r.value.pageMeta };
    });
  }

  @Get('autos') async listarAutos(
    @Query() q: ListAutosGlobalQueryDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.listarAutosGlobal.execute({ ...q });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return { data: r.value.pageData, meta: r.value.pageMeta };
    });
  }

  @Get('autos/resumo') async resumoAutos(
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.resumirAutos.execute({});
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value;
    });
  }

  @Get('licenciamento') async licenciamento(
    @Query() q: ListLicenciamentoQueryDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.listarLicenciamento.execute({ ...q });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return { data: r.value.pageData, meta: r.value.pageMeta };
    });
  }

  @Get(':id') async detalhar(
    @Param('id') id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.detalharObra.execute({ id });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraPrivadaDetalheResponseDto.fromDetalhe(r.value);
    });
  }

  @Patch(':id') async atualizar(
    @Param('id') id: string,
    @Body() b: UpdateObraPrivadaDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.atualizarObra.execute({ ...b, id });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraPrivadaResponseDto.fromEntity(r.value);
    });
  }

  @Delete(':id') @HttpCode(204) async excluir(
    @Param('id') id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.excluirObra.execute({ id });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
    });
  }

  @Get(':id/no-mesmo-imovel') async noMesmoImovel(
    @Param('id') id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.noMesmoImovelSvc.execute({ id });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.map(ObraPrivadaResponseDto.fromEntity);
    });
  }
  @Get(':id/etapas') async etapas(
    @Param('id') obraPrivadaId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.etapasSvc.execute({ obraPrivadaId });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value;
    });
  }
  @Get(':id/timeline') async timeline(
    @Param('id') obraPrivadaId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.timelineSvc.execute({ obraPrivadaId });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value;
    });
  }
}

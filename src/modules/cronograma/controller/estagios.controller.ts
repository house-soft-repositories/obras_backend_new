import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import type { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { IAcompanhamentosUseCase } from '@/modules/cronograma/domain/usecase/acompanhamentos.usecase';
import type IAssumirEstagioUseCase from '@/modules/cronograma/domain/usecase/assumir_estagio.usecase';
import type { IComentariosUseCase } from '@/modules/cronograma/domain/usecase/comentarios.usecase';
import type IConcluirEstagioUseCase from '@/modules/cronograma/domain/usecase/concluir_estagio.usecase';
import type ICreateEstagioUseCase from '@/modules/cronograma/domain/usecase/create_estagio.usecase';
import type ICreateEstagiosLoteUseCase from '@/modules/cronograma/domain/usecase/create_estagios_lote.usecase';
import type IDuplicarEstagioUseCase from '@/modules/cronograma/domain/usecase/duplicar_estagio.usecase';
import type IGetDatasAgregadasUseCase from '@/modules/cronograma/domain/usecase/get_datas_agregadas.usecase';
import type IGetEstagioUseCase from '@/modules/cronograma/domain/usecase/get_estagio.usecase';
import type IGetEstagioAtualUseCase from '@/modules/cronograma/domain/usecase/get_estagio_atual.usecase';
import type IListEstagiosUseCase from '@/modules/cronograma/domain/usecase/list_estagios.usecase';
import type { IPredefinidosUseCase } from '@/modules/cronograma/domain/usecase/predefinidos.usecase';
import type IRemoveEstagioUseCase from '@/modules/cronograma/domain/usecase/remove_estagio.usecase';
import type IReorderEstagiosUseCase from '@/modules/cronograma/domain/usecase/reorder_estagios.usecase';
import type IUpdateEstagioUseCase from '@/modules/cronograma/domain/usecase/update_estagio.usecase';
import type IUpdatePercentualDiretoUseCase from '@/modules/cronograma/domain/usecase/update_percentual_direto.usecase';
import {
  CreateAcompanhamentoDto,
  CreateComentarioDto,
  CreateEstagioDto,
  CreateEstagiosLoteDto,
  ReorderEstagiosDto,
  UpdateAcompanhamentoDto,
  UpdateComentarioDto,
  UpdateEstagioDto,
  UpdatePercentualDiretoDto,
} from '@/modules/cronograma/dtos/estagio.dto';
import AcompanhamentoResponseDto from '@/modules/cronograma/dtos/acompanhamento_response.dto';
import ComentarioResponseDto from '@/modules/cronograma/dtos/comentario_response.dto';
import EstagioResponseDto from '@/modules/cronograma/dtos/estagio_response.dto';
import {
  ACOMPANHAMENTOS_SERVICE,
  ASSUMIR_ESTAGIO_SERVICE,
  COMENTARIOS_SERVICE,
  CONCLUIR_ESTAGIO_SERVICE,
  CREATE_ESTAGIO_SERVICE,
  CREATE_ESTAGIOS_LOTE_SERVICE,
  DUPLICAR_ESTAGIO_SERVICE,
  GET_DATAS_AGREGADAS_SERVICE,
  GET_ESTAGIO_ATUAL_SERVICE,
  GET_ESTAGIO_SERVICE,
  LIST_ESTAGIOS_SERVICE,
  PREDEFINIDOS_SERVICE,
  REMOVE_ESTAGIO_SERVICE,
  REORDER_ESTAGIOS_SERVICE,
  UPDATE_ESTAGIO_SERVICE,
  UPDATE_PERCENTUAL_DIRETO_SERVICE,
} from '@/modules/cronograma/symbols';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras/:obraId/estagios')
@UseGuards(AccessTokenGuard)
export default class EstagiosController {
  constructor(
    @Inject(CREATE_ESTAGIO_SERVICE)
    private readonly createEstagio: ICreateEstagioUseCase,
    @Inject(CREATE_ESTAGIOS_LOTE_SERVICE)
    private readonly createEstagiosLote: ICreateEstagiosLoteUseCase,
    @Inject(LIST_ESTAGIOS_SERVICE)
    private readonly listEstagios: IListEstagiosUseCase,
    @Inject(GET_ESTAGIO_SERVICE)
    private readonly getEstagio: IGetEstagioUseCase,
    @Inject(UPDATE_ESTAGIO_SERVICE)
    private readonly updateEstagio: IUpdateEstagioUseCase,
    @Inject(REMOVE_ESTAGIO_SERVICE)
    private readonly removeEstagio: IRemoveEstagioUseCase,
    @Inject(REORDER_ESTAGIOS_SERVICE)
    private readonly reorderEstagios: IReorderEstagiosUseCase,
    @Inject(UPDATE_PERCENTUAL_DIRETO_SERVICE)
    private readonly updatePercentualDiretoUseCase: IUpdatePercentualDiretoUseCase,
    @Inject(GET_DATAS_AGREGADAS_SERVICE)
    private readonly getDatasAgregadas: IGetDatasAgregadasUseCase,
    @Inject(GET_ESTAGIO_ATUAL_SERVICE)
    private readonly getEstagioAtual: IGetEstagioAtualUseCase,
    @Inject(ASSUMIR_ESTAGIO_SERVICE)
    private readonly assumirEstagio: IAssumirEstagioUseCase,
    @Inject(CONCLUIR_ESTAGIO_SERVICE)
    private readonly concluirEstagio: IConcluirEstagioUseCase,
    @Inject(DUPLICAR_ESTAGIO_SERVICE)
    private readonly duplicarEstagio: IDuplicarEstagioUseCase,
    @Inject(ACOMPANHAMENTOS_SERVICE)
    private readonly acompanhamentosService: IAcompanhamentosUseCase,
    @Inject(COMENTARIOS_SERVICE)
    private readonly comentariosService: IComentariosUseCase,
    @Inject(PREDEFINIDOS_SERVICE)
    private readonly predefinidosService: IPredefinidosUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: CreateEstagioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(await this.createEstagio.execute({ obraId, ...body })),
      ),
    );
  }

  @Get()
  async list(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Query() query: PaginationOptionsDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const page = this.unwrap(
        await this.listEstagios.execute({
          obraId,
          options: new PageOptionsEntity(query.order, query.page, query.take),
        }),
      );
      return {
        data: page.pageData.map((estagio) =>
          EstagioResponseDto.fromEntity(estagio),
        ),
        meta: page.pageMeta,
      };
    });
  }

  @Get('predefinidos')
  async predefinidos(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.predefinidosService.getTemplate({ obraId })),
    );
  }

  @Post('predefinidos')
  async createPredefinidos(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.predefinidosService.create({
          obraId,
          autorUsuarioId: user!.sub,
        }),
      ).map((e) => EstagioResponseDto.fromEntity(e)),
    );
  }

  @Get('datas-agregadas')
  async datasAgregadas(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.getDatasAgregadas.execute({ obraId })),
    );
  }

  @Get('atual')
  async atual(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(await this.getEstagioAtual.execute({ obraId })),
      ),
    );
  }

  @Post('lote')
  async lote(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: CreateEstagiosLoteDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.createEstagiosLote.execute({
          obraId,
          itens: body.itens.map((item) => ({ obraId, ...item })),
        }),
      ).map((e) => EstagioResponseDto.fromEntity(e)),
    );
  }

  @Post('reordenar')
  async reorder(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: ReorderEstagiosDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.reorderEstagios.execute({ obraId, itens: body.itens }),
      ),
    );
  }

  @Get(':id')
  async get(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(await this.getEstagio.execute({ obraId, id })),
      ),
    );
  }

  @Post(':id/acompanhamentos')
  async createAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAcompanhamentoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<AcompanhamentoResponseDto> {
    return this.tc.run(user, async () =>
      AcompanhamentoResponseDto.fromEntity(
        this.unwrap(
          await this.acompanhamentosService.create({
            obraId,
            estagioId: id,
            percentual: body.percentual,
            data: body.data,
            observacao: body.observacao,
            autorUsuarioId: user!.sub,
          }),
        ),
      ),
    );
  }

  @Get(':id/acompanhamentos')
  async listAcompanhamentos(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.acompanhamentosService.list({ obraId, estagioId: id }),
      ).map((e) => AcompanhamentoResponseDto.fromEntity(e)),
    );
  }

  @Get(':id/acompanhamentos/:acompanhamentoId')
  async getAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('acompanhamentoId', ParseUUIDPipe) acompanhamentoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<AcompanhamentoResponseDto> {
    return this.tc.run(user, async () =>
      AcompanhamentoResponseDto.fromEntity(
        this.unwrap(
          await this.acompanhamentosService.get(obraId, id, acompanhamentoId),
        ),
      ),
    );
  }

  @Patch(':id/acompanhamentos/:acompanhamentoId')
  async updateAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('acompanhamentoId', ParseUUIDPipe) acompanhamentoId: string,
    @Body() body: UpdateAcompanhamentoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<AcompanhamentoResponseDto> {
    return this.tc.run(user, async () =>
      AcompanhamentoResponseDto.fromEntity(
        this.unwrap(
          await this.acompanhamentosService.update({
            obraId,
            estagioId: id,
            id: acompanhamentoId,
            percentual: body.percentual,
            data: body.data,
            observacao: body.observacao,
          }),
        ),
      ),
    );
  }

  @Delete(':id/acompanhamentos/:acompanhamentoId')
  @HttpCode(204)
  async removeAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('acompanhamentoId', ParseUUIDPipe) acompanhamentoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.acompanhamentosService.remove(obraId, id, acompanhamentoId),
      ),
    );
  }

  @Post(':id/comentarios')
  async createComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateComentarioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<ComentarioResponseDto> {
    return this.tc.run(user, async () =>
      ComentarioResponseDto.fromEntity(
        this.unwrap(
          await this.comentariosService.create({
            obraId,
            estagioId: id,
            texto: body.texto,
            autorUsuarioId: user!.sub,
          }),
        ),
      ),
    );
  }

  @Get(':id/comentarios')
  async listComentarios(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.comentariosService.list({ obraId, estagioId: id }),
      ).map((e) => ComentarioResponseDto.fromEntity(e)),
    );
  }

  @Get(':id/comentarios/:comentarioId')
  async getComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<ComentarioResponseDto> {
    return this.tc.run(user, async () =>
      ComentarioResponseDto.fromEntity(
        this.unwrap(
          await this.comentariosService.get(obraId, id, comentarioId),
        ),
      ),
    );
  }

  @Patch(':id/comentarios/:comentarioId')
  async updateComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @Body() body: UpdateComentarioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<ComentarioResponseDto> {
    return this.tc.run(user, async () =>
      ComentarioResponseDto.fromEntity(
        this.unwrap(
          await this.comentariosService.update({
            obraId,
            estagioId: id,
            id: comentarioId,
            texto: body.texto,
          }),
        ),
      ),
    );
  }

  @Delete(':id/comentarios/:comentarioId')
  @HttpCode(204)
  async removeComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.comentariosService.remove(obraId, id, comentarioId),
      ),
    );
  }

  @Post(':id/assumir')
  async assumir(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(
          await this.assumirEstagio.execute({
            obraId,
            id,
            responsavelUsuarioId: user!.sub,
          }),
        ),
      ),
    );
  }

  @Post(':id/concluir')
  async concluir(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(await this.concluirEstagio.execute({ obraId, id })),
      ),
    );
  }

  @Post(':id/duplicar')
  async duplicar(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(await this.duplicarEstagio.execute({ obraId, id })),
      ),
    );
  }

  @Patch(':id/percentual-direto')
  async updatePercentualDireto(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePercentualDiretoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(
          await this.updatePercentualDiretoUseCase.execute({
            obraId,
            id,
            percentual: body.percentual,
          }),
        ),
      ),
    );
  }

  @Patch(':id')
  async update(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEstagioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<EstagioResponseDto> {
    return this.tc.run(user, async () =>
      EstagioResponseDto.fromEntity(
        this.unwrap(await this.updateEstagio.execute({ obraId, id, ...body })),
      ),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.removeEstagio.execute({ obraId, id })),
    );
  }

  private readonly unwrap = <T>(result: Either<AppException, T>): T => {
    if (result.isLeft()) {
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    }
    return result.value;
  };
}

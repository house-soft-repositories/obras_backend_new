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
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { ESTAGIOS_SERVICE } from '@/modules/cronograma/symbols';
import type { IEstagiosUseCase } from '@/modules/cronograma/domain/usecase/estagios.usecase';
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
import AppException from '@/core/exceptions/app_exception';
import type { Either } from '@/core/types/either';

@Controller('api/obras/:obraId/estagios')
@UseGuards(AccessTokenGuard)
export default class EstagiosController {
  constructor(
    @Inject(ESTAGIOS_SERVICE) private readonly service: IEstagiosUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: CreateEstagioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.create({ obraId, ...body })).toObject(),
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
        await this.service.list(
          obraId,
          new PageOptionsEntity(query.order, query.page, query.take),
        ),
      );
      return {
        data: page.pageData.map((estagio) => estagio.toObject()),
        meta: page.pageMeta,
      };
    });
  }

  @Get('predefinidos')
  async predefinidos(
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.predefinidos()),
    );
  }

  @Get('datas-agregadas')
  async datasAgregadas(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.datasAgregadas(obraId)),
    );
  }

  @Get('atual')
  async atual(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.atual(obraId)).toObject(),
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
        await this.service.createMany(
          obraId,
          body.itens.map((item) => ({ obraId, ...item })),
        ),
      ).map((estagio) => estagio.toObject()),
    );
  }

  @Post('reordenar')
  async reorder(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: ReorderEstagiosDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.reorder(obraId, body.itens)),
    );
  }

  @Get(':id')
  async get(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.get(obraId, id)).toObject(),
    );
  }

  @Post(':id/acompanhamentos')
  async createAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAcompanhamentoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.createAcompanhamento({
          obraId,
          estagioId: id,
          percentual: body.percentual,
          data: body.data,
          observacao: body.observacao,
          autorUsuarioId: user!.sub,
        }),
      ).toObject(),
    );
  }

  @Get(':id/acompanhamentos/:acompanhamentoId')
  async getAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('acompanhamentoId', ParseUUIDPipe) acompanhamentoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.getAcompanhamento(obraId, id, acompanhamentoId),
      ).toObject(),
    );
  }

  @Patch(':id/acompanhamentos/:acompanhamentoId')
  async updateAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('acompanhamentoId', ParseUUIDPipe) acompanhamentoId: string,
    @Body() body: UpdateAcompanhamentoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.updateAcompanhamento({
          obraId,
          estagioId: id,
          id: acompanhamentoId,
          percentual: body.percentual,
          data: body.data,
          observacao: body.observacao,
        }),
      ).toObject(),
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
        await this.service.removeAcompanhamento(obraId, id, acompanhamentoId),
      ),
    );
  }

  @Post(':id/comentarios')
  async createComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateComentarioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.createComentario({
          obraId,
          estagioId: id,
          texto: body.texto,
          autorUsuarioId: user!.sub,
        }),
      ).toObject(),
    );
  }

  @Get(':id/comentarios/:comentarioId')
  async getComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.getComentario(obraId, id, comentarioId),
      ).toObject(),
    );
  }

  @Patch(':id/comentarios/:comentarioId')
  async updateComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @Body() body: UpdateComentarioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.updateComentario({
          obraId,
          estagioId: id,
          id: comentarioId,
          texto: body.texto,
        }),
      ).toObject(),
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
        await this.service.removeComentario(obraId, id, comentarioId),
      ),
    );
  }

  @Post(':id/assumir')
  async assumir(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.assumir(obraId, id, user!.sub)).toObject(),
    );
  }

  @Post(':id/concluir')
  async concluir(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.concluir(obraId, id)).toObject(),
    );
  }

  @Post(':id/duplicar')
  async duplicar(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.service.duplicar(obraId, id)).toObject(),
    );
  }

  @Patch(':id/percentual-direto')
  async updatePercentualDireto(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePercentualDiretoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.updatePercentualDireto(obraId, id, body.percentual),
      ).toObject(),
    );
  }

  @Patch(':id')
  async update(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEstagioDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.update({ obraId, id, ...body }),
      ).toObject(),
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
      this.unwrap(await this.service.remove(obraId, id)),
    );
  }

  private unwrap<T>(result: Either<AppException, T>): T {
    if (result.isLeft()) {
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    }
    return result.value;
  }
}

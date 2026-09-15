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
  CreateEstagioDto,
  CreateEstagiosLoteDto,
  CreateMedicaoDto,
  CreateAcompanhamentoDto,
  CreateComentarioDto,
  ReorderEstagiosDto,
  UpdatePercentualDiretoDto,
  UpdateEstagioDto,
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
  @Post() async create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() b: CreateEstagioDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.create({ obraId, ...b })).toObject(),
    );
  }
  @Get() async list(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Query() q: PaginationOptionsDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const p = this.unwrap(
        await this.service.list(
          obraId,
          new PageOptionsEntity(q.order, q.page, q.take),
        ),
      );
      return { data: p.pageData.map((e) => e.toObject()), meta: p.pageMeta };
    });
  }
  @Get('predefinidos') async predefinidos(
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.predefinidos()),
    );
  }
  @Get('datas-agregadas') async datasAgregadas(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.datasAgregadas(obraId)),
    );
  }
  @Get('atual') async atual(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.atual(obraId)).toObject(),
    );
  }
  @Post('lote') async lote(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() b: CreateEstagiosLoteDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(
        await this.service.createMany(
          obraId,
          b.itens.map((i) => ({ obraId, ...i })),
        ),
      ).map((e) => e.toObject()),
    );
  }
  @Post('reordenar') async reorder(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() b: ReorderEstagiosDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.reorder(obraId, b.itens)),
    );
  }
  @Get(':id') async get(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.get(obraId, id)).toObject(),
    );
  }
  @Post(':id/acompanhamentos') async createAcompanhamento(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: CreateAcompanhamentoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(
        await this.service.createAcompanhamento({
          obraId,
          estagioId: id,
          percentual: b.percentual,
          data: b.data,
          observacao: b.observacao,
          autorUsuarioId: u!.sub,
        }),
      ).toObject(),
    );
  }
  @Post(':id/comentarios') async createComentario(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: CreateComentarioDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(
        await this.service.createComentario({
          obraId,
          estagioId: id,
          texto: b.texto,
          autorUsuarioId: u!.sub,
        }),
      ).toObject(),
    );
  }
  @Post(':id/concluir') async concluir(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.concluir(obraId, id)).toObject(),
    );
  }
  @Post(':id/duplicar') async duplicar(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.duplicar(obraId, id)).toObject(),
    );
  }
  @Patch(':id/percentual-direto') async updatePercentualDireto(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: UpdatePercentualDiretoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(
        await this.service.updatePercentualDireto(obraId, id, b.percentual),
      ).toObject(),
    );
  }
  @Patch(':id') async update(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: UpdateEstagioDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.update({ obraId, id, ...b })).toObject(),
    );
  }
  @Delete(':id') @HttpCode(204) async remove(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(await this.service.remove(obraId, id)),
    );
  }
  private unwrap<T>(r: Either<AppException, T>): T {
    if (r.isLeft()) {
      throw new HttpException(r.value.message, r.value.statusCode, {
        cause: r.value.cause,
      });
    }
    return r.value;
  }
}

@Controller('api/obras/:obraId/medicoes')
@UseGuards(AccessTokenGuard)
export class MedicoesController {
  constructor(
    @Inject(ESTAGIOS_SERVICE) private readonly service: IEstagiosUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() b: CreateMedicaoDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () =>
      this.unwrap(
        await this.service.createMedicao({ obraId, ...b }),
      ).toObject(),
    );
  }

  @Get()
  async list(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Query() q: PaginationOptionsDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const p = this.unwrap(
        await this.service.listMedicoes(
          obraId,
          new PageOptionsEntity(q.order, q.page, q.take),
        ),
      );
      return { data: p.pageData.map((e) => e.toObject()), meta: p.pageMeta };
    });
  }

  private unwrap<T>(r: Either<AppException, T>): T {
    if (r.isLeft()) {
      throw new HttpException(r.value.message, r.value.statusCode, {
        cause: r.value.cause,
      });
    }
    return r.value;
  }
}

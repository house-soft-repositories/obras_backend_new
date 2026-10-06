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
import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import { MEDICOES_SERVICE } from '@/modules/cronograma/symbols';
import type { IMedicoesUseCase } from '@/modules/cronograma/domain/usecase/medicoes.usecase';
import {
  CreateMedicaoDto,
  UpdateMedicaoDto,
} from '@/modules/cronograma/dtos/medicao.dto';

@Controller('api/obras/:obraId/medicoes')
@UseGuards(AccessTokenGuard)
export default class MedicoesController {
  constructor(
    @Inject(MEDICOES_SERVICE) private readonly service: IMedicoesUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: CreateMedicaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.create({
          obraId,
          numero: body.numero,
          orgaoId: body.orgaoId,
          tipo: body.tipo,
          dataMedicao: body.dataMedicao,
          observacoes: body.observacoes,
          fontes: body.fontes,
        }),
      ).toObject(),
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
        data: page.pageData.map((item) => item.toObject()),
        meta: page.pageMeta,
      };
    });
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

  @Patch(':id')
  async update(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMedicaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(
        await this.service.update({
          obraId,
          id,
          numero: body.numero,
          orgaoId: body.orgaoId,
          tipo: body.tipo,
          dataMedicao: body.dataMedicao,
          observacoes: body.observacoes,
          fontes: body.fontes,
        }),
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

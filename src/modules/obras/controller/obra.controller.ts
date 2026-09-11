import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type ICreateObraUseCase from '@/modules/obras/domain/usecase/create_obra.usecase';
import type IListObrasUseCase from '@/modules/obras/domain/usecase/list_obras.usecase';
import type IGetObraUseCase from '@/modules/obras/domain/usecase/get_obra.usecase';
import type IUpdateObraUseCase from '@/modules/obras/domain/usecase/update_obra.usecase';
import type IDuplicateObraUseCase from '@/modules/obras/domain/usecase/duplicate_obra.usecase';
import CreateObraDto from '@/modules/obras/dtos/create_obra.dto';
import ListObrasQueryDto from '@/modules/obras/dtos/list_obras.dto';
import UpdateObraDto from '@/modules/obras/dtos/update_obra.dto';
import ObraResponseDto from '@/modules/obras/dtos/obra_response.dto';
import {
  CREATE_OBRA_SERVICE,
  DUPLICATE_OBRA_SERVICE,
  GET_OBRA_SERVICE,
  LIST_OBRAS_SERVICE,
  UPDATE_OBRA_SERVICE,
} from '@/modules/obras/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';

@Controller('api/obras')
@UseGuards(AccessTokenGuard)
export default class ObraController {
  constructor(
    @Inject(CREATE_OBRA_SERVICE) private readonly create: ICreateObraUseCase,
    @Inject(LIST_OBRAS_SERVICE) private readonly list: IListObrasUseCase,
    @Inject(GET_OBRA_SERVICE) private readonly get: IGetObraUseCase,
    @Inject(UPDATE_OBRA_SERVICE) private readonly update: IUpdateObraUseCase,
    @Inject(DUPLICATE_OBRA_SERVICE) private readonly duplicar: IDuplicateObraUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async createObra(
    @Body() b: CreateObraDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const tenantId = (u as unknown as { tenantId: string })?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const r = await this.create.execute({
        ...b,
        tenantId,
        criadoPorUsuarioId: (u as unknown as { sub: string })?.sub ?? (u as unknown as { id: string })?.id ?? '',
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraResponseDto.fromEntity(r.value);
    });
  }

  @Get()
  async listObras(
    @Query() q: ListObrasQueryDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const pageOptions = new PageOptionsEntity(q.order, q.page, q.take);
      const r = await this.list.execute({
        status: q.status,
        tipo: q.tipo,
        orgaoId: q.orgaoId,
        q: q.q,
        pageOptions,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      const page = r.value;
      return {
        data: page.pageData.map((e) => ObraResponseDto.fromEntity(e)),
        meta: page.pageMeta,
      };
    });
  }

  @Get(':id')
  async getObra(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.get.execute({ id });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraResponseDto.fromEntity(r.value);
    });
  }

  @Patch(':id')
  async updateObra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateObraDto,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      if ('codigo' in body && (body as Record<string, unknown>)['codigo'] !== undefined) {
        throw new HttpException('codigo is immutable', 400);
      }
      const r = await this.update.execute({ id, data: body });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraResponseDto.fromEntity(r.value);
    });
  }

  @Post(':id/duplicar')
  async duplicarObra(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() u: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(u, async () => {
      const r = await this.duplicar.execute({ id });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return ObraResponseDto.fromEntity(r.value);
    });
  }
}
